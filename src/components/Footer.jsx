import React from "react";
import { Container, Row, Col, Form, Button } from "react-bootstrap";

function Footer() {
  return (
    <footer
      className=" text-dark pt-5 pb-3"
      style={{ backgroundColor: "#F3F3F3" }}
    >
      <Container>
        <Row>
          {/* Column 1 */}
          <Col md={3}>
            <h5>QuickMart</h5>
            <p>Your one-stop shop for daily essentials.</p>
          </Col>

          {/* Column 2 */}
          <Col md={3}>
            <h5>Useful Links</h5>
            <ul className="list-unstyled">
              <li>
                <a
                  href="/privacy-policy"
                  className="text-dark text-decoration-none"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/terms" className="text-dark text-decoration-none">
                  Terms & Conditions
                </a>
              </li>
              <li>
                <a href="/contact" className="text-dark text-decoration-none">
                  Contact
                </a>
              </li>
            </ul>
          </Col>

          {/* Column 3 */}
          <Col md={3}>
            <h5>Customer Support</h5>
            <ul className="list-unstyled">
              <li>
                <a href="/faq" className="text-dark text-decoration-none">
                  FAQ
                </a>
              </li>
              <li>
                <a href="/returns" className="text-dark text-decoration-none">
                  Return Policy
                </a>
              </li>
              <li>
                <a href="/shipping" className="text-dark text-decoration-none">
                  Shipping Info
                </a>
              </li>
            </ul>
          </Col>

          {/* Column 4 - Newsletter */}
          <Col md={3}>
            <h5>Newsletter</h5>
            <Form>
              <Form.Group controlId="formBasicEmail">
                <Form.Control
                  type="email"
                  placeholder="Enter email"
                  className="mb-2"
                />
              </Form.Group>
              <Button variant="outline-danger" type="submit">
                Subscribe
              </Button>
            </Form>
          </Col>
        </Row>

        <hr className="bg-white" />

        <p className="text-center mb-0 fw-bold">
          &copy; {new Date().getFullYear()} QuickMart. All rights reserved
        </p>
      </Container>
    </footer>
  );
}

export default Footer;
