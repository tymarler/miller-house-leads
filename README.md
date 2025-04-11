# Custom Home Design Questionnaire

A modern web application for collecting information from potential clients interested in custom home design. This application helps filter out tire kickers by gathering detailed information about the client's project requirements, timeline, and budget.

## Features

- Multi-step form with three sections:
  1. Personal Information
  2. Project Details
  3. Home Requirements
- Modern, responsive design using Tailwind CSS
- Form validation
- Special features selection
- Detailed project information collection

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Running the Application

1. Start the development server:
   ```bash
   npm start
   ```
2. Open your browser and navigate to `http://localhost:3000`

## Building for Production

To create a production build:

```bash
npm run build
```

The build will be created in the `build` directory.

## Technologies Used

- React
- Tailwind CSS
- Headless UI
- Heroicons

## Form Data Collected

The application collects the following information:

### Personal Information
- Full Name
- Email
- Phone Number

### Project Details
- Timeline
- Budget Range
- Location
- Lot Size

### Home Requirements
- Number of Bedrooms
- Number of Bathrooms
- Desired Square Footage
- Special Features (multiple selection)
- Additional Notes 