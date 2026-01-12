API Specification – Media Distribution Web Application

1. Overview
This document defines the REST API specification for the scalable media distribution web application developed for COM769 Coursework 2. The API is implemented using Azure Functions and exposes endpoints for managing photos, videos, metadata, comments, and ratings.

2. API Design Principles
- RESTful design using HTTP verbs
- Stateless requests
- JSON request and response bodies
- Role-based access control
- Secure access using Azure authentication tokens

3. Authentication & Authorization
Authentication is handled via Azure Static Web Apps Authentication. JWT tokens containing role claims are passed to the backend APIs.

Roles:
- Creator: allowed to upload and manage media
- Consumer: allowed to browse, comment, and rate

4. Base URL
https://<azure-static-web-app-domain>/api

5. Endpoints – Media Upload
POST /media/init-upload
Description: Initializes a media upload and returns a SAS URL.
Access: Creator
Response: SAS URL, mediaId

POST /media/complete
Description: Finalizes upload and stores metadata.
Access: Creator
Request Body: title, caption, location, people, mediaType
Response: Success confirmation

6. Endpoints – Media Retrieval
GET /media
Description: Retrieves paginated list of media.
Access: Consumer

GET /media/search
Description: Searches media by metadata fields.
Access: Consumer

GET /media/{id}
Description: Retrieves details of a single media item.
Access: Consumer

7. Endpoints – Comments & Ratings
POST /media/{id}/comments
Description: Adds a comment to a media item.
Access: Consumer

POST /media/{id}/ratings
Description: Adds or updates a rating.
Access: Consumer

8. Error Handling
Standard HTTP status codes are used:
- 200 OK
- 201 Created
- 400 Bad Request
- 401 Unauthorized
- 403 Forbidden
- 404 Not Found
- 500 Internal Server Error
9. Versioning

The API is versioned using URL path prefixes (e.g., /api/v1/) to allow future evolution.

10. Security Considerations
- Role validation performed at API level
- Secure SAS token generation
- No direct exposure of storage credentials
- HTTPS enforced for all endpoints

11. Conclusion
This API specification supports a scalable, secure, and maintainable backend architecture aligned with Azure cloud-native best practices.
