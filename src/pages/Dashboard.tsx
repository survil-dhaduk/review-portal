import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import { format, subMonths } from "date-fns";
import { Download } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useRatings } from "../context/RatingContext";
import { useUsers } from "../context/UserContext";
import { Rating, User, UserRole } from "../types";

const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { getUsers } = useUsers();
  const { getRatingsByUser, getRatingsByMonth } = useRatings();
  const [usersToRate, setUsersToRate] = useState<User[]>([]);
  const [pendingReviews, setPendingReviews] = useState<number>(0);
  const [avgRatings, setAvgRatings] = useState<any[]>([]);
  const [lowPerformers, setLowPerformers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [userAverageRating, setUserAverageRating] = useState<number>(0);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  // New state for filtering
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [selectedMonths, setSelectedMonths] = useState<number>(3);
  const [ratingThreshold, setRatingThreshold] = useState<number>(7.0);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allRatings, setAllRatings] = useState<Rating[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [userPerformanceData, setUserPerformanceData] = useState<any[]>([]);
  const [filteredPerformanceData, setFilteredPerformanceData] = useState<any[]>([]);

  const isAdmin = currentUser?.role === UserRole.ADMIN;

  // Generate last 12 months for selection
  const getLast12Months = () => {
    const months = [];
    const today = new Date();

    for (let i = 0; i < 12; i++) {
      const date = subMonths(today, i);
      const monthStr = format(date, "yyyy-MM");
      const displayStr = format(date, "MMMM yyyy");
      months.push({ value: monthStr, label: displayStr });
    }

    return months;
  };

  const months = getLast12Months();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Get all users
        const users = await getUsers();
        setAllUsers(users);
        setTotalUsers(users.length);

        // Get developers for rating
        const developers = users.filter(user => user.role === UserRole.DEVELOPER);

        if (currentUser) {
          // Get ratings given by the current user
          const myRatings = await getRatingsByUser(currentUser.uid, true);

          // Current month for filtering
          const currentDate = new Date();
          const currentMonth = format(currentDate, "yyyy-MM");

          // Filter users that need to be rated this month
          const usersNeedingRating = developers.filter(user => {
            // Check if the user is assigned to the current user
            const isAssigned =
              (currentUser.role === UserRole.PROJECT_MANAGER && user.managers?.includes(currentUser.uid)) ||
              (currentUser.role === UserRole.TEAM_LEAD && user.teamLeads?.includes(currentUser.uid));

            // Check if the user has already been rated this month
            const alreadyRated = myRatings.some(
              rating => rating.givenTo === user.uid && rating.month === currentMonth
            );

            return isAssigned && !alreadyRated;
          });

          setUsersToRate(usersNeedingRating);
          setPendingReviews(usersNeedingRating.length);

          // Get user's average rating
          if (currentUser.role !== UserRole.ADMIN) {
            // Calculate average rating from recent ratings
            const recentRatings = await getRatingsByUser(currentUser.uid, false);
            if (recentRatings.length > 0) {
              const totalScore = recentRatings.reduce((sum, rating) => sum + rating.averageScore, 0);
              const avgScore = totalScore / recentRatings.length;
              setUserAverageRating(Math.round(avgScore));
            }
          }

          // Get recent activity
          const recentRatings = myRatings
            .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
            .slice(0, 4)
            .map(rating => {
              const ratedUser = users.find(u => u.uid === rating.givenTo);
              return {
                type: 'review',
                message: `Completed review for ${ratedUser?.name || 'Unknown User'}`,
                timestamp: rating.createdAt.toMillis(),
                color: 'green'
              };
            });
          setRecentActivity(recentRatings);
        }

        // For admin, get users with low performance
        if (isAdmin) {
          await fetchAdminData(users, selectedMonths);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [currentUser, isAdmin, selectedMonths]);

  // New function to fetch admin data
  const fetchAdminData = async (users: User[], monthsCount: number) => {
    try {
      // Get the last N months
      const today = new Date();
      const months = [];
      for (let i = 0; i < monthsCount; i++) {
        const date = subMonths(today, i);
        months.push(format(date, "yyyy-MM"));
      }

      // Fetch all ratings for these months
      const allRatingsData: Rating[] = [];
      for (const month of months) {
        const monthRatings = await getRatingsByMonth(month);
        allRatingsData.push(...monthRatings);
      }
      setAllRatings(allRatingsData);
      setSelectedUser("all");
      // Process data for charts and low performers
      processPerformanceData(users, allRatingsData, months);
    } catch (error) {
      console.error("Error fetching admin data:", error);
    }
  };

  // Process performance data for charts and low performers
  const processPerformanceData = (users: User[], ratings: Rating[], months: string[]) => {
    // Create a map of user performance by month
    const userPerformanceMap: Record<string, Record<string, number[]>> = {};

    // Initialize the map
    users.forEach(user => {
      if (user.role !== UserRole.ADMIN) {
        userPerformanceMap[user.uid] = {};
        months.forEach(month => {
          userPerformanceMap[user.uid][month] = [];
        });
      }
    });

    // Fill in the ratings
    ratings.forEach(rating => {
      if (userPerformanceMap[rating.givenTo] && userPerformanceMap[rating.givenTo][rating.month]) {
        userPerformanceMap[rating.givenTo][rating.month].push(rating.averageScore);
      }
    });

    // Calculate average scores for each user by month
    const monthlyData: any[] = [];
    const userPerformanceData: any[] = [];
    const lowPerformers: User[] = [];

    Object.entries(userPerformanceMap).forEach(([userId, monthScores]) => {
      const user = users.find(u => u.uid === userId);
      if (!user) return;

      // Calculate average for each month
      months.forEach(month => {
        const scores = monthScores[month];
        if (scores && scores.length > 0) {
          const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;

          monthlyData.push({
            month,
            name: user.name,
            score: Math.round(avgScore * 10) / 10,
            userId
          });

          userPerformanceData.push({
            month,
            name: user.name,
            score: Math.round(avgScore * 10) / 10,
            userId
          });
        }
      });

      // Calculate overall average for the user
      let totalScore = 0;
      let totalMonths = 0;

      Object.values(monthScores).forEach(scores => {
        if (scores.length > 0) {
          const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
          totalScore += avgScore;
          totalMonths++;
        }
      });

      const overallAvg = totalMonths > 0 ? totalScore / totalMonths : 0;

      // Add to low performers if average is less than threshold
      if ((overallAvg / 10) < ratingThreshold && (overallAvg / 10) > 0) {
        lowPerformers.push({
          ...user,
          averageScore: overallAvg
        });
      }
    });

    setMonthlyData(monthlyData);
    setUserPerformanceData(userPerformanceData);
    setFilteredPerformanceData(userPerformanceData);
    setLowPerformers(lowPerformers);
  };

  // Handle user filter change
  const handleUserFilterChange = (userId: string) => {
    setSelectedUser(userId);

    if (userId && userId !== "all") {
      // Filter data for selected user
      const filteredData = monthlyData.filter(item => item.userId === userId);
      setFilteredPerformanceData(filteredData);
    } else {
      // Reset to all users
      setFilteredPerformanceData(monthlyData);
    }
  };

  // Handle months filter change
  const handleMonthsFilterChange = (months: string) => {
    const monthsCount = parseInt(months);
    setSelectedMonths(monthsCount);

    // Refetch data with new months count
    if (isAdmin && allUsers.length > 0) {
      fetchAdminData(allUsers, monthsCount);
    }
  };

  // Handle rating threshold change
  const handleRatingThresholdChange = (threshold: string) => {
    const thresholdValue = parseFloat(threshold);
    setRatingThreshold(thresholdValue);

    // Recalculate low performers with new threshold
    if (allUsers.length > 0) {
      const updatedLowPerformers = allUsers
        .filter(user => user.role !== UserRole.ADMIN)
        .map(user => {
          const userScores = monthlyData.filter(item => item.userId === user.uid);
          if (userScores.length === 0) return null;

          const avgScore = userScores.reduce((sum, item) => sum + item.score, 0) / userScores.length;
          if ((avgScore / 10) < thresholdValue && (avgScore / 10) > 0) {

            return {
              ...user,
              averageScore: avgScore
            };
          }
          return null;
        })
        .filter(Boolean) as User[];


      setLowPerformers(updatedLowPerformers);
    }
  };

  // Function to download data as Excel
  const downloadExcel = () => {
    // Create CSV content
    const headers = ['Name', 'Months', 'Average Score'];
    const rows = lowPerformers.map(user => [
      user.name,
      selectedMonths,
      user.averageScore?.toFixed(1) || '0'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Low Performers of ${selectedMonths} Month ${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // Show access denied for non-admin users
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-gray-500">
            You don't have permission to view this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor performance across your organization
        </p>
      </div>

      {/* Admin Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
      <div className="w-full sm:w-1/3">
          <label className="text-sm font-medium mb-1 block">Time Period</label>
          <Select
            value={selectedMonths.toString()}
            onValueChange={handleMonthsFilterChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Last 3 Months">
                Last {selectedMonths} {selectedMonths === 1 ? 'Month' : 'Months'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Last Month</SelectItem>
              <SelectItem value="3">Last 3 Months</SelectItem>
              <SelectItem value="6">Last 6 Months</SelectItem>
              <SelectItem value="12">Last 12 Months</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-full sm:w-1/3">
          <label className="text-sm font-medium mb-1 block">Filter by User</label>
          <Select
            value={selectedUser || "all"}
            onValueChange={handleUserFilterChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Users">
                {selectedUser && selectedUser !== "all"
                  ? allUsers.find(u => u.uid === selectedUser)?.name || "Selected User"
                  : "All Users"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              {allUsers
                .filter(user => user.role !== UserRole.ADMIN)
                .map(user => (
                  <SelectItem key={user.uid} value={user.uid}>
                    {user.name} ({user.role.replace('_', ' ')})
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        

        <div className="w-full sm:w-1/3">
          <label className="text-sm font-medium mb-1 block">Rating Threshold</label>
          <Select
            value={ratingThreshold.toString()}
            onValueChange={handleRatingThresholdChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Rating Threshold">
                {ratingThreshold} ({(ratingThreshold * 10).toFixed(0)}%)
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5.0">5.0 (50%)</SelectItem>
              <SelectItem value="6.0">6.0 (60%)</SelectItem>
              <SelectItem value="7.0">7.0 (70%)</SelectItem>
              <SelectItem value="8.0">8.0 (80%)</SelectItem>
              <SelectItem value="9.0">9.0 (90%)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Active users in the system
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Performers</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <rect width="20" height="14" x="2" y="5" rx="2" />
              <path d="M2 10h20" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {lowPerformers.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Users below {ratingThreshold} rating
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Review Completion</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usersToRate.length > 0
                ? `${Math.round((1 - (pendingReviews / (pendingReviews + 5))) * 100)}%`
                : "100%"}
            </div>
            <p className="text-xs text-muted-foreground">
              {usersToRate.length > 0
                ? `${pendingReviews} of ${pendingReviews + 5} remaining`
                : "All reviews completed"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {monthlyData.length > 0
                ? `${(monthlyData.reduce((sum, item) => sum + item.score, 0) / monthlyData.length).toFixed(1)}`
                : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">
              Average rating across all users
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
    

        <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
            <CardTitle>Low Performers</CardTitle>
            <CardDescription>
              Users with performance below {ratingThreshold*10}%
            </CardDescription>
            </div>
            <Button onClick={downloadExcel} variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </CardHeader>
    
          <CardContent>
            <div className="space-y-4">
              {lowPerformers.length > 0 ? (
                lowPerformers.map((user) => (
                  <div key={user.uid} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-9 w-9 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm">
                        {user.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {user.role.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                    <div className="font-bold">
                      {user.averageScore?.toFixed(1) || 0}%
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">No low performers found</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Recent performance review activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center">
                    <div className={`mr-4 h-2 w-2 rounded-full bg-${activity.color}-500`}></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">No recent activity</p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-2">
          <CardHeader className="flex  justify-between">
            
            <CardTitle>Performance Overview</CardTitle>
            <CardDescription>
              Performance ratings over the last {selectedMonths} months
            </CardDescription>
            
          
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              {filteredPerformanceData.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      {Array.from({ length: selectedMonths }, (_, i) => {
                        const date = subMonths(new Date(), i);
                        return (
                          <TableHead key={i} className="text-center">
                            {format(date, "MMMM yyyy")}
                          </TableHead>
                        );
                      })}
                      <TableHead className="text-center">Average</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from(
                      new Set(filteredPerformanceData.map((item) => item.userId))
                    ).map((userId) => {
                      const user = allUsers.find((u) => u.uid === userId);
                      if (!user) return null;

                      // Get all months for this user
                      const userMonths = Array.from(
                        new Set(
                          filteredPerformanceData
                            .filter((item) => item.userId === userId)
                            .map((item) => item.month)
                        )
                      ).sort();

                      // Calculate average for this user
                      const userScores = filteredPerformanceData.filter(
                        (item) => item.userId === userId
                      );
                      const avgScore =
                        userScores.reduce((sum, item) => sum + item.score, 0) /
                        userScores.length;

                      return (
                        <TableRow key={userId}>
                          <TableCell className="font-medium">
                            {user.name}
                          </TableCell>
                          {Array.from({ length: selectedMonths }, (_, i) => {
                            const date = subMonths(new Date(), i);
                            const monthStr = format(date, "yyyy-MM");
                            const score = filteredPerformanceData.find(
                              (item) =>
                                item.userId === userId && item.month === monthStr
                            );
                            return (
                              <TableCell key={i} className="text-center">
                                {score ? score.score.toFixed(1) : "-"}
                              </TableCell>
                            );
                          })}
                          <TableCell className="text-center font-bold">
                            {avgScore.toFixed(1)}%
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">No rating data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
