
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useCriteria } from "../context/CriteriaContext";
import { CriteriaSet, UserRole, Criterion } from "../types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { Formik, Form, Field, FieldArray } from "formik";
import * as Yup from "yup";
import { Plus, Trash2, Save } from "lucide-react";

// Validation schema for criteria
const CriteriaSchema = Yup.object().shape({
  role: Yup.string().required("Role is required"),
  criteria: Yup.array().of(
    Yup.object().shape({
      title: Yup.string().required("Criterion title is required"),
      weight: Yup.number()
        .required("Weight is required")
        .min(1, "Weight must be at least 1")
        .max(100, "Weight must be at most 100"),
    })
  ),
});

const Criteria: React.FC = () => {
  const { currentUser } = useAuth();
  const { getCriteriaByRole, addCriteriaSet, updateCriteriaSet } = useCriteria();
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.TEAM_LEAD);
  const [criteriaSet, setCriteriaSet] = useState<CriteriaSet | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Check if current user is admin
  const isAdmin = currentUser?.role === UserRole.ADMIN;

  useEffect(() => {
    const fetchCriteria = async () => {
      try {
        setLoading(true);
        const criteria = await getCriteriaByRole(selectedRole);
        setCriteriaSet(criteria);
      } catch (error) {
        console.error("Error fetching criteria:", error);
      } finally {
        setLoading(false);
      }
    };

    if (isAdmin) {
      fetchCriteria();
    }
  }, [isAdmin, selectedRole]);

  const handleRoleChange = async (value: string) => {
    setSelectedRole(value as UserRole);
  };

  const handleSaveCriteria = async (values: any) => {
    try {
      setLoading(true);
      
      // Check if we're updating or creating a new criteria set
      if (criteriaSet?.id) {
        await updateCriteriaSet(criteriaSet.id, values.criteria);
      } else {
        await addCriteriaSet(values.role as UserRole, values.criteria);
      }
      
      // Refresh criteria
      const updatedCriteria = await getCriteriaByRole(values.role as UserRole);
      setCriteriaSet(updatedCriteria);
    } catch (error) {
      console.error("Error saving criteria:", error);
    } finally {
      setLoading(false);
    }
  };

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
        <h1 className="text-2xl font-bold tracking-tight">Rating Criteria</h1>
        <p className="text-muted-foreground">
          Manage the criteria used for performance ratings
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Criteria Management</CardTitle>
          <CardDescription>
            Define rating criteria for each role in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <label className="text-sm font-medium mb-2 block">
              Select Role to Manage Criteria
            </label>
            <Select onValueChange={handleRoleChange} defaultValue={selectedRole}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UserRole.TEAM_LEAD}>Team Lead</SelectItem>
                <SelectItem value={UserRole.PROJECT_MANAGER}>
                  Project Manager
                </SelectItem>
              
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : (
            <Formik
              initialValues={{
                role: selectedRole,
                criteria: criteriaSet?.criteria || [
                  { title: "", weight: 10 }
                ],
              }}
              validationSchema={CriteriaSchema}
              onSubmit={handleSaveCriteria}
              enableReinitialize
            >
              {({ values, errors, touched }) => (
                <Form>
                  <div className="space-y-4">
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[60%]">Criterion</TableHead>
                            <TableHead className="w-[20%]">Weight (%)</TableHead>
                            <TableHead className="w-[20%]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <FieldArray name="criteria">
                            {({ remove, push }) => (
                              <>
                                {values.criteria.length > 0 ? (
                                  values.criteria.map((criterion, index) => (
                                    <TableRow key={index}>
                                      <TableCell>
                                        <Field
                                          name={`criteria.${index}.title`}
                                          as={Input}
                                          placeholder="Criterion title"
                                        />
                                        {errors.criteria?.[index]?.title && 
                                          touched.criteria?.[index]?.title && (
                                            <div className="text-sm text-red-500">
                                              {errors.criteria[index].title}
                                            </div>
                                          )}
                                      </TableCell>
                                      <TableCell>
                                        <Field
                                          name={`criteria.${index}.weight`}
                                          as={Input}
                                          type="number"
                                          min="1"
                                          max="100"
                                        />
                                        {errors.criteria?.[index]?.weight && 
                                          touched.criteria?.[index]?.weight && (
                                            <div className="text-sm text-red-500">
                                              {errors.criteria[index].weight}
                                            </div>
                                          )}
                                      </TableCell>
                                      <TableCell>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => remove(index)}
                                          className="text-red-500"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  ))
                                ) : (
                                  <TableRow>
                                    <TableCell colSpan={3} className="text-center py-4">
                                      No criteria defined yet
                                    </TableCell>
                                  </TableRow>
                                )}
                                <TableRow>
                                  <TableCell colSpan={3}>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={() => push({ title: "", weight: 10 })}
                                      className="w-full"
                                    >
                                      <Plus className="mr-2 h-4 w-4" />
                                      Add Criterion
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              </>
                            )}
                          </FieldArray>
                        </TableBody>
                      </Table>
                    </div>

                    <div className="flex justify-end mt-4">
                      {/* Calculate total weight */}
                      {values.criteria.length > 0 && (
                        <div className="mr-auto text-sm">
                          Total Weight: {values.criteria.reduce((sum, c) => sum + Number(c.weight), 0)}%
                          {values.criteria.reduce((sum, c) => sum + Number(c.weight), 0) !== 100 && (
                            <span className="text-yellow-600 ml-2">
                              (Should equal 100%)
                            </span>
                          )}
                        </div>
                      )}
                      <Button type="submit">
                        <Save className="mr-2 h-4 w-4" />
                        Save Criteria
                      </Button>
                    </div>
                  </div>
                </Form>
              )}
            </Formik>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>
            How criteria will appear in the rating form
          </CardDescription>
        </CardHeader>
        <CardContent>
          {criteriaSet && criteriaSet.criteria.length > 0 ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                This is how the rating form will look for {selectedRole.replace('_', ' ')}s.
              </p>
              {criteriaSet.criteria.map((criterion, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium">{criterion.title}</label>
                    <span className="text-sm text-muted-foreground">
                      {criterion.weight}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-200">
                    <div
                      className="h-full rounded-full bg-indigo-500"
                      style={{ width: "60%" }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No criteria defined yet. Add criteria using the form above.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Criteria;
