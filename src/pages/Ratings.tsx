import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useCriteria } from "../context/CriteriaContext";
import { useRatings } from "../context/RatingContext";
import { useUsers } from "../context/UserContext";
import { CriteriaSet, Rating, User, UserRole } from "../types";

const Ratings: React.FC = () => {
  const { currentUser } = useAuth();
  const { getUsers } = useUsers();
  const { getCriteriaByRole } = useCriteria();
  const { addRating, getRatingsByUser, getRatingsByMonth } = useRatings();

  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [usersToRate, setUsersToRate] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [criteriaSet, setCriteriaSet] = useState<CriteriaSet | null>(null);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [remarks, setRemarks] = useState<string>("");
  const [myRatings, setMyRatings] = useState<Rating[]>([]);
  const [allRatings, setAllRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("rate");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [existingRatings, setExistingRatings] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");

  // Check if current user is admin
  const isAdmin = currentUser?.role === UserRole.ADMIN;

  // Generate last 12 months for selection
  const getLast12Months = () => {
    const months = [];
    const today = new Date();

    for (let i = 0; i < 12; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthStr = format(date, "yyyy-MM");
      const displayStr = format(date, "MMMM yyyy");
      months.push({ value: monthStr, label: displayStr });
    }

    return months;
  };

  const months = getLast12Months();

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);

        if (!currentUser) return;

        // Get all users
        const allUsersData = await getUsers();
        setAllUsers(allUsersData);

        // Get users that can be rated by the current user
        let rateableUsers: User[] = [];

        if (currentUser.role === UserRole.ADMIN) {
          // Admins can rate everyone except themselves
          rateableUsers = allUsersData.filter(user => user.uid !== currentUser.uid);
        } else if (currentUser.role === UserRole.PROJECT_MANAGER || currentUser.role === UserRole.TEAM_LEAD) {
          // PMs and TLs can rate everyone except themselves
          rateableUsers = allUsersData.filter(user => user.uid !== currentUser.uid);
        }

        setUsersToRate(rateableUsers);

        // Get ratings given by the current user
        const ratings = await getRatingsByUser(currentUser.uid, true);
        setMyRatings(ratings);

        // Get all ratings for the current month (for admin view)
        if (isAdmin) {
          const currentDate = new Date();
          const month = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
          const allRatingsData = await getRatingsByMonth();
          setAllRatings(allRatingsData);
        } else {
          // For non-admins, only show their own ratings
          setAllRatings(ratings);
        }
      } catch (error) {
        console.error("Error fetching initial data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [currentUser, isAdmin]);

  // Check if rating already exists for selected user and month
  const checkExistingRating = async (userId: string, month: string) => {
    if (!currentUser) return false;

    try {
      const ratings = await getRatingsByUser(currentUser.uid, true);
      return ratings.some(rating =>
        rating.givenTo === userId &&
        rating.month === month
      );
    } catch (error) {
      console.error("Error checking existing rating:", error);
      return false;
    }
  };

  // Update handleUserSelect to check for existing ratings
  const handleUserSelect = async (userId: string) => {
    try {
      setLoading(true);

      const user = usersToRate.find(u => u.uid === userId) || null;
      setSelectedUser(user);

      if (user && currentUser) {
        // Get the criteria for the current user's role (rater's role)
        const criteria = await getCriteriaByRole(currentUser.role);
        setCriteriaSet(criteria);

        // Initialize ratings for all criteria
        if (criteria) {
          const initialRatings: Record<string, number> = {};
          criteria.criteria.forEach(c => {
            initialRatings[c.title] = 5; // Default to middle value
          });
          setRatings(initialRatings);
        }

        setRemarks("");
        setSubmitted(false);

        // Check if rating already exists for selected month
        if (selectedMonth) {
          const exists = await checkExistingRating(user.uid, selectedMonth);
          setExistingRatings(prev => ({
            ...prev,
            [`${user.uid}-${selectedMonth}`]: exists
          }));
        }
      }
    } catch (error) {
      console.error("Error selecting user:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRatingChange = (criterion: string, value: number[]) => {
    setRatings(prev => ({
      ...prev,
      [criterion]: value[0]
    }));
  };

  const calculateAverageScore = (): number => {
    if (!criteriaSet) return 0;

    let totalWeight = 0;
    let weightedSum = 0;

    criteriaSet.criteria.forEach(criterion => {
      const rating = ratings[criterion.title] || 0;
      weightedSum += rating * criterion.weight / 10; // Convert to percentage
      totalWeight += criterion.weight;
    });

    return totalWeight > 0 ? Math.round(weightedSum / totalWeight * 100) : 0;
  };

  // Update handleSubmitRating to use selected month
  const handleSubmitRating = async () => {
    if (!currentUser || !selectedUser || !criteriaSet || !selectedMonth) return;

    try {
      setSubmitting(true);

      // Check if rating already exists
      const exists = await checkExistingRating(selectedUser.uid, selectedMonth);
      if (exists) {
        alert(`You have already rated ${selectedUser.name} for ${format(new Date(selectedMonth + "-01"), "MMMM yyyy")}.`);
        setSubmitting(false);
        return;
      }

      // Calculate the average score
      const averageScore = calculateAverageScore();

      // Create rating object
      const ratingData: Omit<Rating, 'id' | 'createdAt'> = {
        givenBy: currentUser.uid,
        givenTo: selectedUser.uid,
        month: selectedMonth,
        criteria: ratings,
        averageScore,
        remarks,
        roleOfGivenTo: currentUser.role
      };

      // Save rating
      await addRating(ratingData);

      // Update local state
      const updatedRatings = await getRatingsByUser(currentUser.uid, true);
      setMyRatings(updatedRatings);

      // Update all ratings if admin
      if (isAdmin) {
        const allRatingsData = await getRatingsByMonth(selectedMonth);
        setAllRatings(allRatingsData);
      }

      setSubmitted(true);
    } catch (error) {
      console.error("Error submitting rating:", error);
    } finally {
      setSubmitting(false);
    }
  };

  // Add month selection handler
  const handleMonthSelect = async (month: string) => {
    setSelectedMonth(month);

    // If a user is already selected, check if rating exists for this month
    if (selectedUser) {
      const exists = await checkExistingRating(selectedUser.uid, month);
      setExistingRatings(prev => ({
        ...prev,
        [`${selectedUser.uid}-${month}`]: exists
      }));
    }
  };

  const formatDate = (dateString: string): string => {
    const [year, month] = dateString.split('-');
    return `${month}/${year}`;
  };

  // Get user name by ID
  const getUserName = (userId: string): string => {
    const user = allUsers.find(u => u.uid === userId);
    return user ? user.name : "Unknown User";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Performance Ratings</h1>
        <p className="text-muted-foreground">
          Rate team members based on their performance
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <Tabs defaultValue="rate" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="rate">Rate Users</TabsTrigger>
            <TabsTrigger value="view">View Ratings</TabsTrigger>
          </TabsList>

          <TabsContent value="rate" className="mt-6">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="md:col-span-1 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Select Month</CardTitle>
                    <CardDescription>
                      Choose the month for the performance rating
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Select
                      value={selectedMonth}
                      onValueChange={handleMonthSelect}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a month">
                          {selectedMonth ? format(new Date(selectedMonth + "-01"), "MMMM yyyy") : "Select a month"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {months.map(month => (
                          <SelectItem key={month.value} value={month.value}>
                            {month.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Select User to Rate</CardTitle>
                    <CardDescription>
                      Choose a team member to provide a performance rating
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {usersToRate.length > 0 ? (
                      <Select
                        value={selectedUser?.uid || ""}
                        onValueChange={handleUserSelect}
                        disabled={!selectedMonth}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a user">
                            {selectedUser ? `${selectedUser.name}` : "Select a user"}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <div className="p-2">
                            <input
                              type="text"
                              placeholder="Search user..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="w-full p-2 border rounded mb-2"
                            />
                          </div>
                          {usersToRate
                            .filter(user => user.name.toLowerCase().includes(searchQuery.toLowerCase()))
                            .map(user => {
                              const hasRated = existingRatings[`${user.uid}-${selectedMonth}`];
                              return (
                                <SelectItem
                                  key={user.uid}
                                  value={user.uid}
                                  disabled={hasRated}
                                >
                                  {user.name}
                                  {hasRated && " - Already rated"}
                                </SelectItem>
                              );
                            })}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-muted-foreground">
                        No users available for you to rate
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>My Recent Ratings</CardTitle>
                    <CardDescription>
                      Ratings you've submitted recently
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {myRatings.length > 0 ? (
                      <div className="space-y-4">
                        {myRatings
                          .sort((a, b) => {
                            // Convert Timestamp to Date for comparison
                            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date();
                            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date();
                            return dateB.getTime() - dateA.getTime();
                          })
                          .slice(0, 5)
                          .map(rating => {
                            const user = allUsers.find(u => u.uid === rating.givenTo);
                            return (
                              <div key={rating.id} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
                                <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center text-white">
                                  {user?.name.substring(0, 2).toUpperCase() || "--"}
                                </div>
                                <div className="flex-1">
                                  <div className="text-sm font-medium">
                                    {user?.name || "Unknown User"}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {formatDate(rating.month)} • {rating.averageScore}%
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">
                        You haven't submitted any ratings yet
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="md:col-span-2">
                {selectedUser ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Rate: {selectedUser.name}</CardTitle>
                      <CardDescription>
                        {selectedUser.role.replace('_', ' ')} • {format(new Date(selectedMonth + "-01"), "MMMM yyyy")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {existingRatings[`${selectedUser.uid}-${selectedMonth}`] ? (
                        <div className="text-center py-8">
                          <div className="h-16 w-16 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-500 mx-auto mb-4">
                            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-medium mb-1">Already Rated</h3>
                          <p className="text-muted-foreground">
                            You have already rated {selectedUser.name} for {format(new Date(selectedMonth + "-01"), "MMMM yyyy")}.
                          </p>
                          <Button className="mt-4" onClick={() => setSelectedUser(null)}>
                            Select Another User
                          </Button>
                        </div>
                      ) : submitted ? (
                        <div className="text-center py-8">
                          <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center text-green-500 mx-auto mb-4">
                            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-medium mb-1">Rating Submitted</h3>
                          <p className="text-muted-foreground">
                            Thank you for providing feedback for {selectedUser.name}
                          </p>
                          <Button className="mt-4" onClick={() => setSelectedUser(null)}>
                            Rate Another User
                          </Button>
                        </div>
                      ) : criteriaSet ? (
                        <div className="space-y-6">
                          <div className="space-y-4">
                            {criteriaSet.criteria.map((criterion, index) => (
                              <div key={index} className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <label className="text-sm font-medium">
                                    {criterion.title} ({criterion.weight}%)
                                  </label>
                                  <span className="text-sm font-medium">
                                    {ratings[criterion.title] || 0}/10
                                  </span>
                                </div>
                                <div className="flex flex-wrap justify-between ">
                                  {[...Array(10)].map((_, index) => (
                                    <label key={index} className="inline-flex items-center " >
                                      <input
                                        type="radio"
                                        name={`rating-${criterion.title}`}
                                        value={index + 1}
                                        checked={ratings[criterion.title] === index + 1}
                                        onChange={() => handleRatingChange(criterion.title, [index + 1])}
                                        className="form-radio text-lg"
                                      />
                                      <span className="ml-2">{index + 1}</span>
                                    </label>
                                  ))}
                                </div>
                                <div className="flex justify-between text-xs text-muted-foreground">
                                  <span>Poor</span>
                                  <span>Average</span>
                                  <span>Excellent</span>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium">
                              Additional Comments
                            </label>
                            <Textarea
                              placeholder="Provide any additional feedback or comments..."
                              value={remarks}
                              onChange={(e) => setRemarks(e.target.value)}
                              rows={4}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground">
                            No criteria found for this role. Please contact the administrator.
                          </p>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <div className="text-lg font-medium">
                        Overall Score: {calculateAverageScore()}%
                      </div>
                      <Button
                        onClick={handleSubmitRating}
                        disabled={submitting || submitted || !criteriaSet || existingRatings[`${selectedUser.uid}-${selectedMonth}`]}
                      >
                        {submitting ? (
                          <span className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-3 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Submitting...
                          </span>
                        ) : (
                          "Submit Rating"
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                ) : (
                  <div className="flex flex-col items-center justify-center bg-gray-50 border border-dashed border-gray-200 rounded-lg p-12 h-full">
                    <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500 mb-4">
                      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium mb-1">Select a User</h3>
                    <p className="text-sm text-center text-muted-foreground max-w-md">
                      {selectedMonth
                        ? "Choose a team member from the dropdown on the left to provide a performance rating."
                        : "First select a month, then choose a team member to rate."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="view" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>All Ratings</CardTitle>
                <CardDescription>
                  {isAdmin
                    ? "View all ratings in the system"
                    : "View ratings for team members"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Month</TableHead>
                        <TableHead>Score</TableHead>
                        {isAdmin && <TableHead>Rated By</TableHead>}
                        <TableHead>Role</TableHead>
                        <TableHead>Comments</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allRatings.length > 0 ? (
                        allRatings.map((rating) => {
                          const ratedUser = allUsers.find(u => u.uid === rating.givenTo);
                          const raterUser = allUsers.find(u => u.uid === rating.givenBy);

                          return (
                            <TableRow key={rating.id}>
                              <TableCell className="font-medium">
                                {ratedUser?.name || "Unknown User"}
                              </TableCell>
                              <TableCell>{formatDate(rating.month)}</TableCell>
                              <TableCell>{rating.averageScore}%</TableCell>
                              {isAdmin && (
                                <TableCell>
                                  {raterUser?.name || "Unknown User"}
                                </TableCell>
                              )}
                              <TableCell>
                                {rating.roleOfGivenTo.replace('_', ' ').toUpperCase()}
                              </TableCell>
                              <TableCell className="max-w-xs truncate">
                                {rating.remarks || "No comments"}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={isAdmin ? 6 : 5} className="text-center py-4">
                            No ratings found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default Ratings;
