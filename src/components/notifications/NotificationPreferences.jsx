import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import { getToken } from "../../services/authService";

const API_URL =
  process.env.REACT_APP_API_URL || "https://nextgenretail.site/quickmart/api";

/**
 * Component for managing user notification preferences
 */
const NotificationPreferences = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState({
    pushEnabled: true,
    emailEnabled: true,
    orderUpdates: true,
    messageNotifications: true,
    promotions: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Fetch user notification preferences
  useEffect(() => {
    const fetchPreferences = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const authToken = await getToken();
        const response = await axios.get(
          `${API_URL}/notifications/preferences`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
        );

        if (response.data && response.data.preferences) {
          setPreferences(response.data.preferences);
        }
        setError(null);
      } catch (err) {
        console.error("Error fetching notification preferences:", err);
        setError(
          "Failed to load notification preferences. Please try again later."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
  }, [user]);

  // Handle preference change
  const handlePreferenceChange = (e) => {
    const { name, checked } = e.target;
    setPreferences((prev) => ({
      ...prev,
      [name]: checked,
    }));
    setSaveSuccess(false);
  };

  // Save preferences
  const savePreferences = async () => {
    try {
      setLoading(true);
      const authToken = await getToken();
      await axios.post(
        `${API_URL}/notifications/preferences`,
        { preferences },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      setSaveSuccess(true);
      setError(null);
    } catch (err) {
      console.error("Error saving notification preferences:", err);
      setError("Failed to save preferences. Please try again.");
      setSaveSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="alert alert-info">
        Please log in to manage notification preferences.
      </div>
    );
  }

  return (
    <div className="notification-preferences card">
      <div className="card-header">
        <h5>Notification Preferences</h5>
      </div>
      <div className="card-body">
        {error && <div className="alert alert-danger">{error}</div>}
        {saveSuccess && (
          <div className="alert alert-success">
            Preferences saved successfully!
          </div>
        )}

        <form>
          <div className="mb-3">
            <h6>Notification Channels</h6>
            <div className="form-check">
              <input
                type="checkbox"
                className="form-check-input"
                id="pushEnabled"
                name="pushEnabled"
                checked={preferences.pushEnabled}
                onChange={handlePreferenceChange}
              />
              <label className="form-check-label" htmlFor="pushEnabled">
                Push Notifications
              </label>
            </div>

            <div className="form-check">
              <input
                type="checkbox"
                className="form-check-input"
                id="emailEnabled"
                name="emailEnabled"
                checked={preferences.emailEnabled}
                onChange={handlePreferenceChange}
              />
              <label className="form-check-label" htmlFor="emailEnabled">
                Email Notifications
              </label>
            </div>
          </div>

          <div className="mb-3">
            <h6>Notification Types</h6>
            <div className="form-check">
              <input
                type="checkbox"
                className="form-check-input"
                id="orderUpdates"
                name="orderUpdates"
                checked={preferences.orderUpdates}
                onChange={handlePreferenceChange}
              />
              <label className="form-check-label" htmlFor="orderUpdates">
                Order Updates
              </label>
            </div>

            <div className="form-check">
              <input
                type="checkbox"
                className="form-check-input"
                id="messageNotifications"
                name="messageNotifications"
                checked={preferences.messageNotifications}
                onChange={handlePreferenceChange}
              />
              <label
                className="form-check-label"
                htmlFor="messageNotifications"
              >
                New Messages
              </label>
            </div>

            <div className="form-check">
              <input
                type="checkbox"
                className="form-check-input"
                id="promotions"
                name="promotions"
                checked={preferences.promotions}
                onChange={handlePreferenceChange}
              />
              <label className="form-check-label" htmlFor="promotions">
                Promotions and Offers
              </label>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={savePreferences}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Preferences"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default NotificationPreferences;
