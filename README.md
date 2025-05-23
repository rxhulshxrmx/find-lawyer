# LegalEase - AI-Powered Lawyer Search

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=YOUR_REPO_URL&env=GOOGLE_API_KEY,GOOGLE_GENERATIVE_AI_API_KEY&envDescription=API%20Keys%20required%20for%20Google%20AI%20services&project-name=legal-ease&repository-name=legal-ease)

LegalEase is a Next.js application that helps users find and connect with lawyers based on their specific legal needs. Powered by Google's Gemini AI and vector embeddings, it provides intelligent search capabilities to match users with the most relevant legal professionals.

## Features

- **AI-Powered Search**: Find lawyers using natural language queries
- **Comprehensive Profiles**: View detailed lawyer information including experience, practice areas, and court jurisdictions
- **Smart Matching**: Vector-based semantic search to find the most relevant lawyers
- **Modern UI**: Clean, responsive interface with smooth animations
- **Real-time Results**: Instant search results with streaming responses

## How It Works

1. **User Query Processing**:
   - User enters a search query (e.g., "divorce lawyer in Mumbai")
   - The query is processed by Google's Gemini AI to understand intent

2. **Vector Search**:
   - The system converts the query into a vector embedding
   - Searches the database for lawyers with similar vectors
   - Ranks results by relevance using cosine similarity

3. **Response Generation**:
   - Formats the results in a user-friendly way
   - Includes all relevant details (experience, location, practice areas)
   - Provides direct links to lawyer profiles

## Technical Stack

- **Frontend**: Next.js 14, React, TypeScript
- **AI/ML**: Google Gemini AI, Vector Embeddings
- **Database**: PostgreSQL with pgvector
- **Styling**: Tailwind CSS
- **Animation**: Framer Motion
- **Deployment**: Vercel

## Challenges & Solutions

### 1. Data Consistency
**Problem**: Inconsistent lawyer data formats from different sources  
**Solution**: Implemented data normalization and validation to ensure consistent formatting

### 2. Search Relevance
**Problem**: Basic keyword matching returned irrelevant results  
**Solution**: Switched to vector embeddings for semantic search, improving result quality

### 3. Response Formatting
**Problem**: AI responses were either too verbose or omitted key details  
**Solution**: Created structured prompts and response templates to ensure consistent, detailed outputs

### 4. Performance
**Problem**: Slow search response times with large datasets  
**Solution**: Implemented vector indexing and query optimization

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Google Cloud account with Generative AI API access

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/legal-ease.git
   cd legal-ease
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Update the `.env` file with your credentials:
   ```
   GOOGLE_API_KEY=your_google_api_key
   GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key
   DATABASE_URL=your_postgres_connection_string
   ```

4. Run database migrations:
   ```bash
   npx drizzle-kit push:pg
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment

### Vercel Deployment

1. Push your code to a GitHub repository
2. Import the repository in Vercel
3. Add the required environment variables in Vercel's project settings
4. Deploy!

### Manual Deployment

1. Build the application:
   ```bash
   npm run build
   ```
2. Start the production server:
   ```bash
   npm start
   ```

## Deployment on Render.com

### Prerequisites
- A GitHub account
- A Render.com account

### Steps to Deploy

1. **Push your code to GitHub**
   - If you haven't already, initialize a git repository and push your code:
     ```bash
     git init
     git add .
     git commit -m "Initial commit"
     git remote add origin <your-github-repo-url>
     git push -u origin main
     ```

2. **Deploy on Render.com**
   - Go to [Render.com](https://render.com/) and sign in.
   - Click on "New" and select "Web Service".
   - Connect your GitHub repository.
   - Select the repository and branch you want to deploy.
   - Configure the service:
     - **Name**: find-lawyer (or any name you prefer)
     - **Environment**: Docker
     - **Branch**: main (or your default branch)
     - **Plan**: Free
   - Click "Create Web Service".
   - Render will automatically detect the `render.yaml` file and set up the service and database.
   - Wait for the deployment to complete. Your app will be live at a public URL provided by Render.

3. **Environment Variables**
   - The `DATABASE_URL` is automatically set by Render using the `render.yaml` configuration.

4. **Accessing Your App**
   - Once deployed, you can access your app at the URL provided by Render.

## Local Development

To run the app locally:

```bash
npm install
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
