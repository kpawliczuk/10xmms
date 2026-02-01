# funnyMMS

![Project Status: MVP](https://img.shields.io/badge/status-MVP-green.svg)

A web application that allows users to generate unique, humorous graphics using AI and instantly send them as MMS messages to their own phone.

## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Project Description

Coming up with funny pictures or memes can be difficult and time-consuming. `funnyMMS` solves this by providing a simple tool to turn your ideas into reality.

Users can type a short text description in Polish, and the application will use an AI model to generate a funny image. This image is then sent directly to the user's verified phone number as an MMS message. The app includes a simple user account system to track sent MMS history and manage daily usage limits.

## Tech Stack

The project is built with a modern and efficient tech stack, chosen for rapid MVP development and scalability.

*   **Frontend:**
    *   HTMX - For creating dynamic interfaces with the simplicity of HTML attributes.
*   **Backend & Database:**
    *   Supabase - An open-source Firebase alternative providing:
        *   PostgreSQL Database
        *   Authentication (including SMS-based 2FA)
        *   Auto-generated APIs
        *   Edge Functions for server-side logic
*   **Artificial Intelligence:**
    *   Google AI - Access to Google's powerful generative models (e.g., Gemini) for image creation.
*   **CI/CD & Hosting:**
    *   GitHub Actions - For building CI/CD pipelines.
    *   DigitalOcean App Platform - For hosting the application via a Docker image on the Free Tier.

## Getting Started Locally

To set up and run the project on your local machine, follow these steps.

**1. Prerequisites:**

*   Docker and Docker Compose
*   Node.js and npm (or a similar package manager)
*   Access keys for:
    *   Supabase (Project URL and `anon` key)
    *   Google AI
    *   smsapi.pl

**2. Clone the repository:**

```bash
git clone https://github.com/your-username/funnyMMS.git
cd funnyMMS
```

**3. Configure Environment Variables:**

Create a `.env` file in the root of the project by copying the example file:

```bash
cp .env.example .env
```

Now, open the `.env` file and fill in the required API keys and credentials for Supabase, Google AI, and smsapi.pl.

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key

GOOGLE_AI_API_KEY=your_google_ai_api_key

SMSAPI_TOKEN=your_smsapi_bearer_token
```

**4. Install dependencies:**

```bash
npm install
```

**5. Run the application:**

To start the local development server, run:

```bash
npm run dev
```

The application should now be available at `http://localhost:3000`.

## Available Scripts

*   `npm run dev`: Starts the application in development mode.
*   `npm run build`: Builds the application for production.
*   `npm run start`: Runs the production-ready build.

## Project Scope

### MVP Features

*   **User Accounts:** Simple registration and login system.
*   **Phone Verification:** Users must verify their phone number via SMS.
*   **AI Image Generation:** Generate graphics from a Polish text prompt.
*   **MMS Sending:** Automatically send the generated image to the user's phone.
*   **Usage Limits:** A daily limit of 5 MMS messages per user.
*   **MMS History:** A profile page where users can view their previously sent MMS messages.

### Out of Scope for MVP

*   Sharing MMS history between accounts.
*   Saving MMS as drafts.
*   Advanced user-facing statistics.

## Project Status

The project is currently in the **MVP (Minimum Viable Product)** development phase. The core functionalities are being built and tested.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.