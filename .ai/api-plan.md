# REST API Plan

This document outlines the REST API design for the `funnyMMS` MVP, built on the Supabase platform. The API is designed to be secure, efficient, and aligned with the project's functional requirements.

## 1. Resources

The API exposes the following primary resources, which correspond to the database tables:

-   **`/profiles`**: Represents user profile data.
    -   Database Table: `public.profiles`
-   **`/mms`**: Represents the core functionality of generating and sending MMS messages. It serves as a transactional endpoint rather than a direct CRUD interface to the `mms_history` table.
    -   Database Table: `public.mms_history`
-   **`/mms_history`**: Represents the read-only history of a user's sent MMS messages.
    -   Database Table: `public.mms_history`

*Authentication and user management are handled by Supabase's built-in `/auth/v1` endpoints and are not detailed here.*

## 2. Endpoints

### Profiles Resource

These endpoints are for managing user-specific profile data. They are largely handled by Supabase's auto-generated API, secured by RLS policies.

---

#### Get Current User's Profile

-   **Method**: `GET`
-   **Path**: `/rest/v1/profiles?select=*&id=eq.{user_id}`
-   **Description**: Retrieves the profile information for the currently authenticated user.
-   **Query Parameters**:
    -   `select=*`: Specifies all columns to be returned.
    -   `id=eq.{user_id}`: Filters the results to the current user's ID. This is enforced by RLS, but explicit filtering is good practice.
-   **Request Payload**: None
-   **Response Payload**:
    ```json
    [
      {
        "id": "c8b4e7a3-2b7e-4b8a-8b8a-0e1b9a1b2c3d",
        "username": "testuser",
        "phone_number": "+48...123",
        "updated_at": "2023-10-27T10:00:00Z"
      }
    ]
    ```
-   **Success**: `200 OK`
-   **Errors**: `401 Unauthorized`, `404 Not Found`

---

#### Update Current User's Profile

-   **Method**: `PATCH`
-   **Path**: `/rest/v1/profiles?id=eq.{user_id}`
-   **Description**: Updates the profile information (e.g., username) for the currently authenticated user.
-   **Query Parameters**:
    -   `id=eq.{user_id}`: Specifies which user profile to update.
-   **Request Payload**:
    ```json
    {
      "username": "new_username"
    }
    ```
-   **Response Payload**: None
-   **Success**: `204 No Content`
-   **Errors**: `400 Bad Request`, `401 Unauthorized`, `409 Conflict` (if username is taken)

### MMS Resource

This is a custom endpoint, implemented as a Supabase Edge Function, that handles the core business logic of the application.

---

#### Generate and Send MMS

-   **Method**: `POST`
-   **Path**: `/functions/v1/mms`
-   **Description**: Initiates the process of generating an image from a text prompt and sending it as an MMS. This single transaction handles limit checks, AI generation, and MMS gateway integration.
-   **Query Parameters**: None
-   **Request Payload**:
    ```json
    {
      "prompt": "A cat wearing a party hat riding a skateboard"
    }
    ```
-   **Response Payload**:
    ```json
    {
      "message": "MMS generation and sending process initiated successfully.",
      "history_id": "a1b2c3d4-e5f6-7890-1234-567890abcdef"
    }
    ```
-   **Success**: `202 Accepted` - Indicates the request has been accepted for processing, but the processing has not been completed.
-   **Errors**:
    -   `400 Bad Request`: "Prompt cannot be empty." or "Prompt exceeds 300 characters."
    -   `401 Unauthorized`: If the user is not authenticated.
    -   `429 Too Many Requests`: "User daily limit of 5 MMS reached." or "Global daily limit reached."
    -   `500 Internal Server Error`: "Failed to generate image from AI provider." or "Failed to send MMS."

### MMS History Resource

This endpoint provides read-only access to the user's MMS history, leveraging Supabase's auto-generated API with powerful filtering and sorting.

---

#### Get User's MMS History

-   **Method**: `GET`
-   **Path**: `/rest/v1/mms_history`
-   **Description**: Retrieves a paginated list of the authenticated user's sent MMS messages, sorted from newest to oldest.
-   **Query Parameters**:
    -   `select=id,prompt,status,model_info,created_at`: Specifies the columns to return. `image_data` is excluded for performance.
    -   `order=created_at.desc`: Sorts the results by creation date in descending order.
    -   `limit=10`: Paginates the results.
    -   `offset=0`: Specifies the starting point for pagination.
-   **Request Payload**: None
-   **Response Payload**:
    ```json
    [
      {
        "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
        "prompt": "A cat wearing a party hat...",
        "status": "success",
        "model_info": "gemini-pro-vision",
        "created_at": "2023-10-27T12:34:56Z"
      },
      {
        "id": "b2c3d4e5-f6a7-8901-2345-67890abcdef1",
        "prompt": "A dog flying a kite...",
        "status": "success",
        "model_info": "gemini-pro-vision",
        "created_at": "2023-10-27T11:22:33Z"
      }
    ]
    ```
-   **Success**: `200 OK`
-   **Errors**: `401 Unauthorized`

## 3. Authentication and Authorization

-   **Authentication**: All endpoints (except Supabase's built-in `/auth/v1/signup`) require authentication. The client must include a valid JSON Web Token (JWT) in the `Authorization` header with every request: `Authorization: Bearer <SUPABASE_JWT>`. This token is obtained from Supabase Auth upon successful login.

-   **Authorization**: Authorization is enforced at the database level using PostgreSQL's **Row-Level Security (RLS)**.
    -   The policies defined in the database schema ensure that users can only `SELECT` and `UPDATE` their own `profiles` record.
    -   Similarly, users can only `SELECT` their own records from the `mms_history` table.
    -   The custom `POST /functions/v1/mms` endpoint will internally use the authenticated user's ID (`auth.uid()`) to perform all operations, ensuring actions are always executed in the context of the correct user.

## 4. Validation and Business Logic

### Request Validation

Validation is handled at multiple layers:

-   **Database Constraints**: The `mms_history` table has a `CHECK` constraint to ensure the `prompt` length does not exceed 300 characters. This serves as a final safeguard.
-   **API Layer (Edge Function)**: The `POST /functions/v1/mms` endpoint will perform primary validation on the incoming request payload before any processing occurs.
    -   It will check if the `prompt` field exists and is not empty.
    -   It will verify the `prompt` length against the 300-character limit.

### Business Logic Implementation

The core business logic is encapsulated within the `POST /functions/v1/mms` Edge Function. The sequence of operations is as follows:

1.  **Authentication Check**: The function first verifies that a valid, authenticated user is making the request.
2.  **Input Validation**: It validates the incoming `prompt` as described above.
3.  **Limit Enforcement**:
    -   It calls the `count_user_mms_today()` database function to check the user's personal daily limit. If the limit (>= 5) is reached, it returns a `429 Too Many Requests` error.
    -   It queries the `daily_global_stats` table to check the global daily limit. If the limit (>= 20) is reached, it returns a `429 Too Many Requests` error.
4.  **AI Image Generation**: It makes a server-to-server call to the Google AI (Gemini) API with the user's prompt.
    -   If this step fails, it logs the error and returns a `500 Internal Server Error`. The `mms_history` record is created with a `generation_failed` status.
5.  **MMS Sending**: It makes a server-to-server call to the `smsapi.pl` gateway, sending the generated image data.
    -   If this step fails, it logs the error and returns a `500 Internal Server Error`. The `mms_history` record is updated to a `send_failed` status.
6.  **Database Logging**:
    -   A record is created in `mms_history` at the beginning of the process.
    -   The `status` of this record is updated throughout the process (`success`, `generation_failed`, `send_failed`).
    -   The `daily_global_stats` table is incremented upon successful initiation.
7.  **Success Response**: If all steps are initiated correctly, the function returns a `202 Accepted` response to the client.