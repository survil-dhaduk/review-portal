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
import { Field, Form, Formik } from "formik";
import { Edit, Trash2, Upload, UserPlus, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import * as Yup from "yup";
import { useAuth } from "../context/AuthContext";
import { useUsers } from "../context/UserContext";
import { User, UserRole } from "../types";

// Validation schema for adding/editing a user
const UserSchema = Yup.object().shape({
  name: Yup.string().required("Name is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  role: Yup.string().required("Role is required"),
});

const Users: React.FC = () => {
  const { currentUser } = useAuth();
  const { getUsers, addUser, updateUser, deleteUser, uploadUsers } = useUsers();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<UserRole | "all">("all");
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [showUploadForm, setShowUploadForm] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<{
    success: number;
    errors: string[];
  } | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Check if current user is admin
  const isAdmin = currentUser?.role === UserRole.ADMIN;

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const fetchedUsers = await getUsers();
        setUsers(fetchedUsers);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const handleFilterChange = async (value: string) => {
    try {
      setLoading(true);
      setFilter(value as UserRole | "all");

      if (value === "all") {
        const fetchedUsers = await getUsers();
        setUsers(fetchedUsers);
      } else {
        const fetchedUsers = await getUsers(value as UserRole);
        setUsers(fetchedUsers);
      }
    } catch (error) {
      console.error("Error filtering users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (values: any, { resetForm }: any) => {
    try {
      await addUser({
        name: values.name,
        email: values.email,
        role: values.role as UserRole,
      });

      // Refresh user list
      const fetchedUsers = await getUsers();
      setUsers(fetchedUsers);

      // Reset form and hide it
      resetForm();
      setShowAddForm(false);
    } catch (error) {
      console.error("Error adding user:", error);
    }
  };

  const handleEditUser = async (values: any, { resetForm }: any) => {
    if (!editingUser) return;
    try {
      await updateUser(editingUser.uid, {
        name: values.name,
        email: values.email,
        role: values.role as UserRole,
      });

      // Refresh user list
      const fetchedUsers = await getUsers();
      setUsers(fetchedUsers);

      // Reset form and hide it
      resetForm();
      setEditingUser(null);
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  const handleDeleteUser = async (uid: string) => {
    try {
      await deleteUser(uid);

      // Remove the deleted user from the state
      setUsers(users.filter(user => user.uid !== uid));
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      try {
        const result = await uploadUsers(file);
        setUploadStatus(result);

        // Refresh user list
        const fetchedUsers = await getUsers();
        setUsers(fetchedUsers);
      } catch (error) {
        console.error("Error uploading users:", error);
        setUploadStatus({
          success: 0,
          errors: ["Failed to upload file. Please try again."],
        });
      }
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage users and their roles in the system
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setShowUploadForm(!showUploadForm);
              setShowAddForm(false);
              setEditingUser(null);
            }}
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload Users
          </Button>
          <Button
            onClick={() => {
              setShowAddForm(!showAddForm);
              setShowUploadForm(false);
              setEditingUser(null);
            }}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>

      {(showAddForm || editingUser) && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>{editingUser ? "Edit User" : "Add New User"}</CardTitle>
              {editingUser && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditingUser(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <CardDescription>
              {editingUser
                ? "Update user details"
                : "Enter user details to create a new account"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Formik
              initialValues={{
                name: editingUser?.name || "",
                email: editingUser?.email || "",
                role: editingUser?.role || "",
              }}
              validationSchema={UserSchema}
              onSubmit={editingUser ? handleEditUser : handleAddUser}
            >
              {({ errors, touched }) => (
                <Form className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-medium">
                        Full Name
                      </label>
                      <Field
                        id="name"
                        name="name"
                        as={Input}
                        placeholder="John Doe"
                      />
                      {errors.name && touched.name && (
                        <div className="text-sm text-red-500">{String(errors.name)}</div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium">
                        Email
                      </label>
                      <Field
                        id="email"
                        name="email"
                        type="email"
                        as={Input}
                        placeholder="john@example.com"
                      />
                      {errors.email && touched.email && (
                        <div className="text-sm text-red-500">{String(errors.email)}</div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="role" className="text-sm font-medium">
                        Role
                      </label>
                      <Field name="role">
                        {({ field, form }: any) => (
                          <Select
                            onValueChange={(value) => form.setFieldValue(field.name, value)}
                            defaultValue={field.value}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                              <SelectItem value={UserRole.PROJECT_MANAGER}>
                                Project Manager
                              </SelectItem>
                              <SelectItem value={UserRole.TEAM_LEAD}>
                                Team Lead
                              </SelectItem>
                              <SelectItem value={UserRole.DEVELOPER}>
                                Developer
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </Field>
                      {errors.role && touched.role && (
                        <div className="text-sm text-red-500">{String(errors.role)}</div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowAddForm(false);
                        setEditingUser(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingUser ? "Update User" : "Add User"}
                    </Button>
                  </div>
                </Form>
              )}
            </Formik>
          </CardContent>
        </Card>
      )}

      {showUploadForm && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Users from Excel</CardTitle>
            <CardDescription>
              Upload an Excel file with user details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700"
                  >
                    Select Excel File
                    <input
                      id="file-upload"
                      type="file"
                      className="sr-only"
                      accept=".xlsx,.xls"
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Excel file format: Name, Email, Role
                </p>
              </div>

              {uploadStatus && (
                <div>
                  <div className="text-green-600 mb-2">
                    Successfully added {uploadStatus.success} users
                  </div>
                  {uploadStatus.errors.length > 0 && (
                    <div className="mb-2">
                      <div className="text-red-600 mb-1">
                        Failed to add {uploadStatus.errors.length} users:
                      </div>
                      <ul className="text-sm text-red-500 list-disc pl-5">
                        {uploadStatus.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowUploadForm(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            List of all users in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm">Filter by role:</label>
              <Select onValueChange={handleFilterChange} defaultValue={filter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                  <SelectItem value={UserRole.PROJECT_MANAGER}>
                    Project Manager
                  </SelectItem>
                  <SelectItem value={UserRole.TEAM_LEAD}>Team Lead</SelectItem>
                  <SelectItem value={UserRole.DEVELOPER}>Developer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead key="name">Name</TableHead>
                    <TableHead key="email">Email</TableHead>
                    <TableHead key="role">Role</TableHead>
                    <TableHead key="actions">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length > 0 ? (
                    users.map((user) => (
                      <TableRow key={user.uid}>
                        <TableCell key={`${user.uid}-name`} className="font-medium">{user.name}</TableCell>
                        <TableCell key={`${user.uid}-email`}>{user.email}</TableCell>
                        <TableCell key={`${user.uid}-role`} className="capitalize">
                          {user.role.replace('_', ' ')}
                        </TableCell>
                        <TableCell key={`${user.uid}-actions`}>
                          <div className="flex space-x-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                setEditingUser(user);
                                setShowAddForm(false);
                                setShowUploadForm(false);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-red-500"
                              onClick={() => handleDeleteUser(user.uid)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow key="no-users">
                      <TableCell colSpan={4} className="text-center py-4">
                        No users found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Users;
