import React from "react";
import { Container, Row, Col, Button } from "react-bootstrap";
import { Link } from "react-router-dom";

const NotFoundPage = () => {
  return (
    <Container
      fluid
      className="d-flex justify-content-center align-items-center min-vh-100 bg-white"
    >
      <Row className="justify-content-center w-100">
        <Col md={8} lg={6} className="text-center p-4">
          <img
            src="/404 error.png"
            alt="404 Error"
            className="img-fluid mb-4"
            style={{ maxWidth: "500px" }}
          />
          <h1 className="fw-bold fs-1">Page Not Found</h1>
          <p className="text-muted fs-5">
            The page you are looking for might have been removed, had its name
            changed, or is temporarily unavailable.
          </p>
          <Link to="/">
            <Button
              variant="danger"
              className="px-4 py-2 rounded-pill fw-bold mt-3"
            >
              Home Page
            </Button>
          </Link>
        </Col>
      </Row>
    </Container>
  );
};

export default NotFoundPage;
