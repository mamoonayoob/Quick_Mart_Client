import React from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import { FaCube, FaHeadset, FaUserCheck } from "react-icons/fa";

const services = [
  {
    icon: <FaCube size={60} className="text-danger mb-3" />,
    title: "Return & ",
    subtitle: "Service",
    heading: "Need to make a return?",
    description:
      "Start your return process here or contact our support team for assistance.",
  },
  {
    icon: <FaHeadset size={60} className="text-danger mb-3" />,
    title: "Customer ",
    subtitle: "Service",
    heading: "Need help?",
    description:
      "Our customer service team is here for you 24/7—chat with us or email support anytime!",
  },
  {
    icon: <FaUserCheck size={60} className="text-danger mb-3" />,
    title: "Account ",
    subtitle: "Service",
    heading: "Manage your account with ease!",
    description:
      "Update details, track orders, and more in your account dashboard.",
  },
];

const CustomerService = () => {
  return (
    <Container className="my-5 " >
      <h2 className="text-center fw-semibold mb-5">Customer Service</h2>
      <Row>
        {services.map((service, index) => (
          <Col key={index} xs={12} md={6} lg={4} className="mb-4">
            <Card className="p-3 shadow-sm d-flex flex-column" style={{ height: "120%" }}>
              <div className="d-flex justify-content-center ">
                {service.icon}
              </div>
              <h5 className="d-flex justify-content-center gap-2">
                {service.title}
                <span className="fw-bold">{service.subtitle}</span>
              </h5>
              <Card.Body className="d-flex flex-column flex-grow-1 justify-content-center">
                <Card.Text className="fw-bold fs-5 text-center">
                  {service.heading}
                </Card.Text>
                <Card.Text className="text-muted text-center">
                  {service.description}
                </Card.Text>
              </Card.Body>
              <div className="text-center mt-auto">
                <Button variant="outline-danger">Chat with Us</Button>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default CustomerService;
