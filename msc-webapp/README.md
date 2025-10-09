# MSC-SCU Frontend (React SPA)

This is the React frontend for the Microsoft Student Club - Suez Canal University website.

## Project Structure

```
msc-webapp/
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── Navbar.js       # Navigation bar
│   │   ├── Footer.js       # Footer component
│   │   └── PrivateRoute.js # Protected route wrapper
│   ├── pages/              # Page-level components
│   │   ├── Landing.js      # Home page
│   │   ├── Team.js         # Team members page
│   │   ├── Events.js       # Events page
│   │   ├── AdminLogin.js   # Admin login page
│   │   └── AdminDashboard.js # Admin dashboard
│   ├── services/           # API service layer
│   │   ├── apiClient.js    # Axios instance with interceptors
│   │   └── api.js          # API endpoint functions
│   ├── context/            # React Context providers
│   │   └── AuthContext.js  # Authentication state management
│   ├── hooks/              # Custom React hooks (future)
│   ├── assets/             # Images, fonts, etc. (future)
│   ├── App.js              # Main app component with routing
│   └── index.js            # App entry point
├── .env                    # Environment variables
├── .env.development        # Development environment variables
├── .env.production         # Production environment variables
├── tailwind.config.js      # Tailwind CSS configuration
└── package.json            # Dependencies and scripts
```

## Tech Stack

- **React 18**: UI library
- **React Router DOM**: Client-side routing
- **Axios**: HTTP client for API calls
- **Tailwind CSS**: Utility-first CSS framework
- **Context API**: Global state management

## Brand Colors (from Tailwind config)

- **Primary**: `#0078d4` (Microsoft blue)
- **Primary Hover**: `#50e6ff` (Light blue accent)
- **Navy**: `#203a6c` (Dark blue for navbar/footer)
- **Accent**: `#50e6ff`
- **Background White**: `#ffffff`
- **Background Light**: `#f2f2f2`
- **Text**: `#2e2e2e`
- **Text Light**: `#ffffff`

## Routes

### Public Routes
- `/` - Landing page (hero, vision/mission, featured events, team preview)
- `/team` - Full team members page (High Board, Board, Golden Members)
- `/events` - All events page with filtering
- `/admin/login` - Admin login page

### Protected Routes (require authentication)
- `/admin/dashboard` - Admin dashboard (SuperAdmin and ContentEditor)

## API Integration

### API Base URL
- **Development**: `https://localhost:7157/api` (ASP.NET Core Web API)
- **Production**: Configure in `.env.production`

### Authentication Flow
1. User enters email/password on `/admin/login`
2. `AuthContext.login()` calls `/api/auth/login`
3. JWT token stored in localStorage
4. `apiClient` automatically attaches token to all requests via interceptor
5. `PrivateRoute` checks `isAuthenticated()` before rendering protected routes
6. Token expiration checked on each request (1-hour lifetime)

### API Services (src/services/api.js)
- `authApi`: Login
- `membersApi`: CRUD operations for members
- `eventsApi`: CRUD operations for events
- `siteContentApi`: CRUD operations for site content
- `adminUsersApi`: CRUD operations for admin users (SuperAdmin only)
- `uploadApi`: Generate SAS tokens and upload to Azure Blob Storage

## Available Scripts


In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
