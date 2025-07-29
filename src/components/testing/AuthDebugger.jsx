import React from 'react';
import { useSelector } from 'react-redux';
import { Card, Container, Alert } from 'react-bootstrap';

const AuthDebugger = () => {
  const auth = useSelector(state => state.auth);
  const { isAuthenticated, user, loading, error } = auth || {};
  
  return (
    <Container className="mt-4">
      <h2>Authentication Debugger</h2>
      <Card className="mb-3">
        <Card.Header>Redux Auth State</Card.Header>
        <Card.Body>
          <p><strong>Loading:</strong> {loading ? 'True' : 'False'}</p>
          <p><strong>Authenticated:</strong> {isAuthenticated ? 'True' : 'False'}</p>
          <p><strong>User Role:</strong> {user?.role || 'Not set'}</p>
          
          {error && (
            <Alert variant="danger">
              <strong>Error:</strong> {error}
            </Alert>
          )}
          
          <h5 className="mt-3">Complete User Object:</h5>
          <pre className="bg-light p-3 rounded">
            {JSON.stringify(user, null, 2)}
          </pre>
          
          <h5 className="mt-3">Complete Auth State:</h5>
          <pre className="bg-light p-3 rounded">
            {JSON.stringify(auth, null, 2)}
          </pre>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AuthDebugger;
