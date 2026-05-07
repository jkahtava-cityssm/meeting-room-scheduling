'use client';

import { useState } from 'react';
import { useSession } from '@/contexts/SessionProvider';
import { fetchDELETE, fetchGET, fetchPATCH, fetchPOST, fetchPUT } from '@/lib/fetch-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, Clock, Play, RotateCcw, Users, Building, Calendar, Settings, Shield, Globe, Database } from 'lucide-react';

interface TestResult {
  endpoint: string;
  method: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  responseTime?: number;
  error?: string;
  expectedStatus?: number;
  actualStatus?: number;
}

// Basic response validation function
function validateResponse(endpoint: string, data: unknown): string | null {
  try {
    // Check for standard API response structure
    if (typeof data !== 'object' || data === null) {
      return 'Response is not a valid object';
    }

    const responseObj = data as Record<string, unknown>;

    // Most endpoints return data in a 'data' field
    if (endpoint.startsWith('/api/') && !endpoint.includes('/send-mail')) {
      if (!('data' in responseObj)) {
        return 'Response missing required "data" field';
      }
    }

    // Specific validations for different endpoints
    if (endpoint === '/api/public/configuration') {
      const configData = responseObj.data;
      if (!configData || typeof configData !== 'object') {
        return 'Configuration response should have data object';
      }
    }

    if (endpoint === '/api/references/status') {
      const statusData = responseObj.data;
      if (!Array.isArray(statusData)) {
        return 'Status response should be an array';
      }
      if (statusData.length === 0) {
        return 'Status array should not be empty';
      }
      // Check that each status has required fields
      const status = statusData[0] as Record<string, unknown>;
      if (!status.key || !status.name) {
        return 'Status objects should have key and name fields';
      }
    }

    if (endpoint === '/api/users') {
      const usersData = responseObj.data;
      if (!Array.isArray(usersData)) {
        return 'Users response should be an array';
      }
    }

    if (endpoint.startsWith('/api/users/') && endpoint.split('/').length === 3) {
      // Single user endpoint
      const userData = responseObj.data;
      if (!userData || typeof userData !== 'object') {
        return 'User response should have data object';
      }
      const userObj = userData as Record<string, unknown>;
      if (!userObj.id && !userObj.userId) {
        return 'User object should have id or userId field';
      }
    }

    if (endpoint === '/api/rooms') {
      const roomsData = responseObj.data;
      if (!Array.isArray(roomsData)) {
        return 'Rooms response should be an array';
      }
    }

    if (
      endpoint.startsWith('/api/rooms/') &&
      endpoint.split('/').length === 3 &&
      !endpoint.includes('/properties') &&
      !endpoint.includes('/categories')
    ) {
      // Single room endpoint
      const roomData = responseObj.data;
      if (!roomData || typeof roomData !== 'object') {
        return 'Room response should have data object';
      }
    }

    if (endpoint === '/api/events' || endpoint.startsWith('/api/events/')) {
      // Events can be arrays or single objects
      if (endpoint === '/api/events' || endpoint.includes('/status') || endpoint.includes('/my-events')) {
        const eventsData = responseObj.data;
        if (!Array.isArray(eventsData)) {
          return 'Events response should be an array';
        }
      } else if (endpoint.split('/').length === 3) {
        // Single event
        const eventData = responseObj.data;
        if (!eventData || typeof eventData !== 'object') {
          return 'Event response should have data object';
        }
      }
    }

    if (endpoint === '/api/configuration') {
      const configData = responseObj.data;
      if (!Array.isArray(configData)) {
        return 'Configuration response should be an array';
      }
    }

    return null; // No validation errors
  } catch (error) {
    return `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

export default function TestApiPage() {
  const { session, isPending } = useSession();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string>('');
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('');
  const [runCount, setRunCount] = useState<number>(1);

  // Test data constants (based on seeded data)
  const TEST_DATA = {
    userId: 1, // SYSTEM user or first seeded user
    roomId: 1, // First seeded room
    eventId: 1, // First seeded event
    roleId: 1, // Admin role
  };

  // Redirect if not authenticated
  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please log in to access the API testing page.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const isSecretHeaderEndpoint = (endpoint: string) => {
    return endpoint.startsWith('/api/public/') || endpoint.endsWith('/roles') || endpoint === '/api/send-mail';
  };

  // Test categories for grouped testing
  const testCategories = [
    {
      id: 'all',
      name: 'All Tests',
      icon: Database,
      description: 'Run all API tests',
      filter: () => true,
    },
    {
      id: 'public',
      name: 'Public & References',
      icon: Globe,
      description: 'Public endpoints and reference data',
      filter: (endpoint: string) => endpoint.startsWith('/api/public/') || endpoint.startsWith('/api/references/'),
    },
    {
      id: 'users',
      name: 'Users',
      icon: Users,
      description: 'User management endpoints',
      filter: (endpoint: string) => endpoint.includes('/users'),
    },
    {
      id: 'rooms',
      name: 'Rooms',
      icon: Building,
      description: 'Room management endpoints',
      filter: (endpoint: string) => endpoint.includes('/rooms'),
    },
    {
      id: 'events',
      name: 'Events',
      icon: Calendar,
      description: 'Event management endpoints',
      filter: (endpoint: string) => endpoint.includes('/events'),
    },
    {
      id: 'config',
      name: 'Configuration',
      icon: Settings,
      description: 'Configuration endpoints',
      filter: (endpoint: string) => endpoint.includes('/configuration'),
    },
    {
      id: 'admin',
      name: 'Admin',
      icon: Shield,
      description: 'Administrative endpoints',
      filter: (endpoint: string) => endpoint.startsWith('/api/admin/'),
    },
  ];

  const runApiTests = async (filter?: (endpoint: string) => boolean, iterations: number = 1) => {
    setIsRunning(true);
    if (!filter) setTestResults([]); // Only clear results for full test runs

    // Define all test cases based on API endpoints
    const allTestCases: Array<{
      endpoint: string;
      method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
      body?: unknown;
      params?: Record<string, string>;
      expectedStatus: number;
      description: string;
    }> = [
      // Public endpoints
      {
        endpoint: '/api/public/configuration',
        method: 'GET',
        expectedStatus: 200,
        description: 'Get public configuration',
      },
      {
        endpoint: '/api/public/events',
        method: 'GET',
        params: {
          startdate: new Date().toISOString(),
          enddate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
        expectedStatus: 200,
        description: 'Get public events in date range',
      },
      {
        endpoint: '/api/public/rooms',
        method: 'GET',
        expectedStatus: 200,
        description: 'Get public rooms',
      },
      {
        endpoint: '/api/references/status',
        method: 'GET',
        expectedStatus: 200,
        description: 'Get event statuses',
      },
      {
        endpoint: '/api/references/items',
        method: 'GET',
        expectedStatus: 200,
        description: 'Get event items',
      },
      {
        endpoint: '/api/references/properties',
        method: 'GET',
        expectedStatus: 200,
        description: 'Get properties',
      },

      // User management endpoints
      {
        endpoint: '/api/users',
        method: 'GET',
        expectedStatus: 200,
        description: 'Get all users',
      },
      {
        endpoint: '/api/users',
        method: 'GET',
        params: { onlyActive: 'true' },
        expectedStatus: 200,
        description: 'Get active users only',
      },

      // Room management endpoints
      {
        endpoint: '/api/rooms',
        method: 'GET',
        expectedStatus: 200,
        description: 'Get accessible rooms',
      },
      {
        endpoint: '/api/rooms/properties',
        method: 'GET',
        expectedStatus: 200,
        description: 'Get room properties',
      },
      {
        endpoint: '/api/rooms/categories',
        method: 'GET',
        expectedStatus: 200,
        description: 'Get room categories',
      },

      // Event management endpoints
      {
        endpoint: '/api/events',
        method: 'GET',
        params: {
          startdate: new Date().toISOString(),
          enddate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
        expectedStatus: 200,
        description: 'Get events in date range',
      },
      {
        endpoint: '/api/events/my-events',
        method: 'GET',
        params: {
          startdate: new Date().toISOString(),
          enddate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
        expectedStatus: 200,
        description: 'Get user events',
      },
      {
        endpoint: '/api/events/status',
        method: 'GET',
        params: {
          startdate: new Date().toISOString(),
          enddate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          statusKey: 'PENDING',
        },
        expectedStatus: 200,
        description: 'Get events by status',
      },
      {
        endpoint: '/api/events/status/counts',
        method: 'GET',
        params: { statusKey: 'PENDING' },
        expectedStatus: 200,
        description: 'Get event status counts',
      },

      // Configuration endpoints
      {
        endpoint: '/api/configuration',
        method: 'GET',
        expectedStatus: 200,
        description: 'Get all configuration',
      },
      {
        endpoint: '/api/configuration/hours',
        method: 'GET',
        expectedStatus: 200,
        description: 'Get visible hours',
      },
      {
        endpoint: '/api/configuration/scheduler',
        method: 'GET',
        expectedStatus: 200,
        description: 'Get scheduler status',
      },

      // User management with specific IDs
      {
        endpoint: `/api/users/${TEST_DATA.userId}`,
        method: 'GET',
        expectedStatus: 200,
        description: 'Get specific user by ID',
      },
      {
        endpoint: `/api/users/${TEST_DATA.userId}/roles`,
        method: 'GET',
        expectedStatus: 200,
        description: 'Get user roles',
      },

      // Room management with specific IDs
      {
        endpoint: `/api/rooms/${TEST_DATA.roomId}`,
        method: 'GET',
        expectedStatus: 200,
        description: 'Get specific room by ID',
      },

      // Event management with specific IDs
      {
        endpoint: `/api/events/${TEST_DATA.eventId}`,
        method: 'GET',
        expectedStatus: 200,
        description: 'Get specific event by ID',
      },
      {
        endpoint: `/api/events/my-events/${TEST_DATA.eventId}`,
        method: 'GET',
        expectedStatus: 200,
        description: 'Get user specific event',
      },

      // Admin endpoints with specific IDs
      {
        endpoint: '/api/admin/permissions/users',
        method: 'GET',
        params: { roleId: TEST_DATA.roleId.toString() },
        expectedStatus: 200,
        description: 'Get users by role',
      },
      {
        endpoint: '/api/admin/permissions',
        method: 'GET',
        expectedStatus: 200,
        description: 'Get all permissions',
      },
      {
        endpoint: '/api/admin/permissions/roles',
        method: 'GET',
        expectedStatus: 200,
        description: 'Get permission roles',
      },
      {
        endpoint: '/api/admin/permissions/users',
        method: 'PUT',
        body: {
          roleId: TEST_DATA.roleId.toString(),
          userId: TEST_DATA.userId.toString(),
          permit: true,
        },
        expectedStatus: 200,
        description: 'Update user permissions',
      },
      {
        endpoint: '/api/admin/permissions',
        method: 'PUT',
        body: [
          {
            roleId: TEST_DATA.roleId.toString(),
            actionId: '1',
            resourceId: '1',
            permit: true,
          },
        ],
        expectedStatus: 200,
        description: 'Update role permissions',
      },
      {
        endpoint: '/api/admin/impersonate',
        method: 'POST',
        body: { roleId: TEST_DATA.roleId.toString() },
        expectedStatus: 200,
        description: 'Start impersonation',
      },
      {
        endpoint: '/api/admin/impersonate',
        method: 'DELETE',
        expectedStatus: 200,
        description: 'Stop impersonation',
      },
      {
        endpoint: '/api/admin/revalidate',
        method: 'POST',
        expectedStatus: 200,
        description: 'Revalidate cache',
      },
      /*{
        endpoint: '/api/admin/register-sso',
        method: 'POST',
        body: {
          email: 'test@example.com',
          name: 'Test User',
          providerId: 'test123',
        },
        expectedStatus: 200,
        description: 'Register SSO user',
      },*/

      // Configuration endpoints with mutations
      {
        endpoint: '/api/configuration',
        method: 'PUT',
        body: {
          key: 'test_config',
          value: 'test_value',
        },
        expectedStatus: 200,
        description: 'Update configuration',
      },
      {
        endpoint: '/api/configuration/scheduler',
        method: 'POST',
        body: {
          enabled: true,
          interval: 30,
        },
        expectedStatus: 200,
        description: 'Update scheduler settings',
      },
      {
        endpoint: '/api/configuration/scheduler/sync',
        method: 'POST',
        expectedStatus: 200,
        description: 'Sync scheduler',
      },
      {
        endpoint: '/api/configuration/scheduler',
        method: 'DELETE',
        expectedStatus: 200,
        description: 'Delete scheduler settings',
      },

      // Event management with mutations
      {
        endpoint: '/api/events',
        method: 'POST',
        body: {
          title: 'Test Event',
          description: 'Test event description',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          statusId: 1,
          userId: TEST_DATA.userId,
          eventRooms: [{ roomId: TEST_DATA.roomId }],
        },
        expectedStatus: 201,
        description: 'Create new event',
      },
      {
        endpoint: '/api/events',
        method: 'PUT',
        body: {
          eventId: TEST_DATA.eventId,
          title: 'Updated Test Event',
          description: 'Updated test event description',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          statusId: 1,
          userId: TEST_DATA.userId,
          eventRooms: [{ roomId: TEST_DATA.roomId }],
        },
        expectedStatus: 200,
        description: 'Update event',
      },
      {
        endpoint: `/api/events/${TEST_DATA.eventId}`,
        method: 'PUT',
        body: {
          title: 'Updated Event by ID',
          description: 'Updated event description',
        },
        expectedStatus: 200,
        description: 'Update specific event',
      },
      {
        endpoint: `/api/events/${TEST_DATA.eventId}`,
        method: 'DELETE',
        expectedStatus: 200,
        description: 'Delete specific event',
      },

      // Room management with mutations
      {
        endpoint: '/api/rooms',
        method: 'POST',
        body: {
          name: 'Test Room',
          description: 'Test room description',
          capacity: 10,
          categoryId: 1,
        },
        expectedStatus: 201,
        description: 'Create new room',
      },
      {
        endpoint: '/api/rooms',
        method: 'PUT',
        body: {
          roomId: TEST_DATA.roomId,
          name: 'Updated Test Room',
          description: 'Updated test room description',
          capacity: 15,
        },
        expectedStatus: 200,
        description: 'Update room',
      },
      {
        endpoint: `/api/rooms/${TEST_DATA.roomId}`,
        method: 'PUT',
        body: {
          name: 'Updated Room by ID',
          description: 'Updated room description',
        },
        expectedStatus: 200,
        description: 'Update specific room',
      },
      {
        endpoint: `/api/rooms/${TEST_DATA.roomId}`,
        method: 'DELETE',
        expectedStatus: 200,
        description: 'Delete specific room',
      },

      // User management with mutations
      {
        endpoint: '/api/users',
        method: 'POST',
        body: {
          email: 'testuser@example.com',
          name: 'Test User',
          isActive: true,
        },
        expectedStatus: 201,
        description: 'Create new user',
      },
      {
        endpoint: '/api/users',
        method: 'PUT',
        body: {
          userId: TEST_DATA.userId,
          name: 'Updated Test User',
          email: 'updated@example.com',
          isActive: true,
        },
        expectedStatus: 200,
        description: 'Update user',
      },
      {
        endpoint: `/api/users/${TEST_DATA.userId}`,
        method: 'PUT',
        body: {
          name: 'Updated User by ID',
          email: 'updated-by-id@example.com',
        },
        expectedStatus: 200,
        description: 'Update specific user',
      },
      {
        endpoint: `/api/users/${TEST_DATA.userId}`,
        method: 'DELETE',
        expectedStatus: 200,
        description: 'Delete specific user',
      },

      // Send mail endpoint
      /*{
        endpoint: '/api/send-mail',
        method: 'POST',
        body: {
          to: 'test@example.com',
          subject: 'Test Email',
          html: '<p>This is a test email</p>',
        },
        expectedStatus: 200,
        description: 'Send test email',
      },*/
    ];

    // Filter test cases based on the provided filter
    const testCases = filter ? allTestCases.filter((testCase) => filter(testCase.endpoint)) : allTestCases;

    // Run tests for the specified number of iterations
    for (let iteration = 0; iteration < iterations; iteration++) {
      for (const testCase of testCases) {
        const iterationSuffix = iterations > 1 ? ` (Run ${iteration + 1}/${iterations})` : '';
        setCurrentTest(`${testCase.description}${iterationSuffix}`);

        const startTime = Date.now();

        try {
          let responseBody: unknown = null;
          let actualStatus = 0;

          if (isSecretHeaderEndpoint(testCase.endpoint)) {
            responseBody = await fetchPOST('/api/test-api', {
              url: testCase.endpoint,
              method: testCase.method,
              params: testCase.params,
              data: testCase.body,
            });
            actualStatus = 200;
          } else {
            switch (testCase.method) {
              case 'GET':
                responseBody = await fetchGET(testCase.endpoint, testCase.params ?? {});
                actualStatus = 200;
                break;
              case 'POST':
                responseBody = await fetchPOST(testCase.endpoint, (testCase.body as object) ?? {});
                actualStatus = 200;
                break;
              case 'PUT':
                responseBody = await fetchPUT(testCase.endpoint, (testCase.body as object) ?? {});
                actualStatus = 200;
                break;
              case 'DELETE':
                responseBody = await fetchDELETE(testCase.endpoint);
                actualStatus = 200;
                break;
              case 'PATCH':
                responseBody = await fetchPATCH(testCase.endpoint, (testCase.body as object) ?? {});
                actualStatus = 200;
                break;
              default:
                throw new Error(`Unsupported method: ${testCase.method}`);
            }
          }

          const responseTime = Date.now() - startTime;
          const validationError = actualStatus === testCase.expectedStatus && responseBody ? validateResponse(testCase.endpoint, responseBody) : null;

          const result: TestResult = {
            endpoint: testCase.endpoint,
            method: testCase.method,
            status: actualStatus === testCase.expectedStatus && !validationError ? 'passed' : 'failed',
            responseTime,
            expectedStatus: testCase.expectedStatus,
            actualStatus,
            error: validationError || undefined,
          };

          if (actualStatus !== testCase.expectedStatus && !result.error) {
            const responseMessage: string | undefined =
              typeof responseBody === 'object' && responseBody !== null && 'message' in responseBody
                ? ((responseBody as Record<string, unknown>).message as string)
                : undefined;
            result.error = responseMessage || `Unexpected status: ${actualStatus}`;
          }

          setTestResults((prev) => [...prev, result]);
        } catch (error) {
          const responseTime = Date.now() - startTime;

          const result: TestResult = {
            endpoint: testCase.endpoint,
            method: testCase.method,
            status: 'failed',
            responseTime,
            expectedStatus: testCase.expectedStatus,
            error: error instanceof Error ? error.message : 'Unknown error',
          };

          setTestResults((prev) => [...prev, result]);
        }

        // Small delay between tests
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    setIsRunning(false);
    setCurrentTest('');
  };

  const runSingleTest = async () => {
    if (!selectedEndpoint) return;

    const testCase = [
      // Public endpoints
      { endpoint: '/api/public/configuration', method: 'GET' as const, expectedStatus: 200, description: 'Get public configuration' },
      {
        endpoint: '/api/public/events',
        method: 'GET' as const,
        params: { startdate: new Date().toISOString(), enddate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() },
        expectedStatus: 200,
        description: 'Get public events in date range',
      },
      { endpoint: '/api/public/rooms', method: 'GET' as const, expectedStatus: 200, description: 'Get public rooms' },
      { endpoint: '/api/references/status', method: 'GET' as const, expectedStatus: 200, description: 'Get event statuses' },
      { endpoint: '/api/references/items', method: 'GET' as const, expectedStatus: 200, description: 'Get event items' },
      { endpoint: '/api/references/properties', method: 'GET' as const, expectedStatus: 200, description: 'Get properties' },
      // User management
      { endpoint: '/api/users', method: 'GET' as const, expectedStatus: 200, description: 'Get all users' },
      { endpoint: `/api/users/${TEST_DATA.userId}`, method: 'GET' as const, expectedStatus: 200, description: 'Get specific user by ID' },
      { endpoint: `/api/users/${TEST_DATA.userId}/roles`, method: 'GET' as const, expectedStatus: 200, description: 'Get user roles' },
      // Room management
      { endpoint: '/api/rooms', method: 'GET' as const, expectedStatus: 200, description: 'Get accessible rooms' },
      { endpoint: `/api/rooms/${TEST_DATA.roomId}`, method: 'GET' as const, expectedStatus: 200, description: 'Get specific room by ID' },
      // Event management
      {
        endpoint: '/api/events',
        method: 'GET' as const,
        params: { startdate: new Date().toISOString(), enddate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() },
        expectedStatus: 200,
        description: 'Get events in date range',
      },
      { endpoint: `/api/events/${TEST_DATA.eventId}`, method: 'GET' as const, expectedStatus: 200, description: 'Get specific event by ID' },
      // Configuration
      { endpoint: '/api/configuration', method: 'GET' as const, expectedStatus: 200, description: 'Get all configuration' },
      { endpoint: '/api/configuration/hours', method: 'GET' as const, expectedStatus: 200, description: 'Get visible hours' },
      { endpoint: '/api/configuration/scheduler', method: 'GET' as const, expectedStatus: 200, description: 'Get scheduler status' },
      // Admin
      { endpoint: '/api/admin/permissions', method: 'GET' as const, expectedStatus: 200, description: 'Get all permissions' },
      {
        endpoint: '/api/admin/permissions/users',
        method: 'GET' as const,
        params: { roleId: TEST_DATA.roleId.toString() },
        expectedStatus: 200,
        description: 'Get users by role',
      },
    ].find((tc) => tc.endpoint === selectedEndpoint);

    if (testCase) {
      await runApiTests((endpoint) => endpoint === selectedEndpoint, runCount);
    }
  };

  const runCategoryTests = async (categoryId: string) => {
    const category = testCategories.find((cat) => cat.id === categoryId);
    if (category) {
      await runApiTests(category.filter);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'passed':
        return (
          <Badge variant="default" className="bg-green-500">
            Passed
          </Badge>
        );
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'running':
        return <Badge variant="secondary">Running</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const passedTests = testResults.filter((r) => r.status === 'passed').length;
  const failedTests = testResults.filter((r) => r.status === 'failed').length;
  const totalTests = testResults.length;

  return (
    <div className="flex flex-col h-full w-full min-w-92">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">API Testing Suite</h1>
        <p className="text-muted-foreground">Test all API endpoints to ensure they are working correctly with your current session.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTests}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Passed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{passedTests}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{failedTests}</div>
          </CardContent>
        </Card>
      </div>
      <ScrollArea className="w-full flex-1 min-h-0 p-4" type="always">
        {/* Single Endpoint Testing */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5" />
              Single Endpoint Testing
            </CardTitle>
            <CardDescription>Test a specific endpoint multiple times</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="endpoint-select">Select Endpoint</Label>
                <Select value={selectedEndpoint} onValueChange={setSelectedEndpoint}>
                  <SelectTrigger id="endpoint-select">
                    <SelectValue placeholder="Choose an endpoint to test" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="/api/public/configuration">GET /api/public/configuration</SelectItem>
                    <SelectItem value="/api/public/events">GET /api/public/events</SelectItem>
                    <SelectItem value="/api/public/rooms">GET /api/public/rooms</SelectItem>
                    <SelectItem value="/api/references/status">GET /api/references/status</SelectItem>
                    <SelectItem value="/api/references/items">GET /api/references/items</SelectItem>
                    <SelectItem value="/api/references/properties">GET /api/references/properties</SelectItem>
                    <SelectItem value="/api/users">GET /api/users</SelectItem>
                    <SelectItem value={`/api/users/${TEST_DATA.userId}`}>GET /api/users/{TEST_DATA.userId}</SelectItem>
                    <SelectItem value={`/api/users/${TEST_DATA.userId}/roles`}>GET /api/users/{TEST_DATA.userId}/roles</SelectItem>
                    <SelectItem value="/api/rooms">GET /api/rooms</SelectItem>
                    <SelectItem value={`/api/rooms/${TEST_DATA.roomId}`}>GET /api/rooms/{TEST_DATA.roomId}</SelectItem>
                    <SelectItem value="/api/events">GET /api/events</SelectItem>
                    <SelectItem value={`/api/events/${TEST_DATA.eventId}`}>GET /api/events/{TEST_DATA.eventId}</SelectItem>
                    <SelectItem value="/api/configuration">GET /api/configuration</SelectItem>
                    <SelectItem value="/api/configuration/hours">GET /api/configuration/hours</SelectItem>
                    <SelectItem value="/api/configuration/scheduler">GET /api/configuration/scheduler</SelectItem>
                    <SelectItem value="/api/admin/permissions">GET /api/admin/permissions</SelectItem>
                    <SelectItem value="/api/admin/permissions/users">GET /api/admin/permissions/users</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full sm:w-32">
                <Label htmlFor="run-count">Run Count</Label>
                <Input
                  id="run-count"
                  type="number"
                  min="1"
                  max="50"
                  value={runCount}
                  onChange={(e) => setRunCount(Math.max(1, parseInt(e.target.value) || 1))}
                />
              </div>
              <Button onClick={runSingleTest} disabled={isRunning || !selectedEndpoint} variant="outline">
                <Play className="mr-2 h-4 w-4" />
                Run Test
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Category Testing */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Test Categories</CardTitle>
            <CardDescription>Run tests by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {testCategories.map((category) => {
                const Icon = category.icon;
                return (
                  <Button
                    key={category.id}
                    onClick={() => runCategoryTests(category.id)}
                    disabled={isRunning}
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-center gap-2"
                  >
                    <Icon className="h-6 w-6" />
                    <div className="text-center">
                      <div className="font-medium text-sm">{category.name}</div>
                      <div className="text-xs text-muted-foreground mt-1">{category.description}</div>
                    </div>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="mb-6">
          <Button onClick={() => runApiTests()} disabled={isRunning} size="lg" className="w-full md:w-auto">
            {isRunning ? (
              <>
                <Clock className="mr-2 h-4 w-4 animate-spin" />
                Running Tests...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Run All Tests
              </>
            )}
          </Button>

          {currentTest && <p className="mt-2 text-sm text-muted-foreground">Currently testing: {currentTest}</p>}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>Detailed results of all API endpoint tests</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-2">
                {testResults.map((result, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(result.status)}
                      <div>
                        <div className="font-medium">
                          {result.method} {result.endpoint}
                        </div>
                        {result.error && <div className="text-sm text-red-600 mt-1">{result.error}</div>}
                        {result.expectedStatus && result.actualStatus && result.expectedStatus !== result.actualStatus && (
                          <div className="text-sm text-muted-foreground">
                            Expected: {result.expectedStatus}, Got: {result.actualStatus}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {result.responseTime && <span className="text-sm text-muted-foreground">{result.responseTime}ms</span>}
                      {getStatusBadge(result.status)}
                    </div>
                  </div>
                ))}

                {testResults.length === 0 && !isRunning && (
                  <div className="text-center py-8 text-muted-foreground">No tests run yet. Click &quot;Run All Tests&quot; to start.</div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </ScrollArea>
    </div>
  );
}
