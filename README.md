# SiteSnag - AI-Powered Domain Name Generator

SiteSnag is a modern web application that helps users find the perfect domain name using AI-powered suggestions. The app integrates with Mistral AI for creative domain generation and uses domain availability APIs to ensure suggested domains are available for registration.

## Features

- AI-powered domain name generation using Mistral AI
- Real-time domain availability checking
- Interactive refinement through user actions:
  - "More Like This" - Generate similar domain suggestions
  - "Less Like This" - Remove and avoid similar suggestions
  - "Trash" - Remove unwanted suggestions
  - "Star" - Save favorite domain names
- Buffer system for smooth user experience
- Modern, responsive UI built with Next.js and Tailwind CSS

## Getting Started

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory with the following variables:
```
MISTRAL_API_KEY=your_mistral_api_key
DOMAIN_API_KEY=your_domain_api_key
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Tech Stack

- Next.js 13+ with App Router
- TypeScript
- Tailwind CSS
- React Icons
- Mistral AI API
- Domain Availability API

## Project Structure

```
sitesnag/
├── app/
│   ├── api/
│   │   └── domains/
│   │       └── route.ts    # API endpoints for domain generation
│   ├── components/
│   │   ├── DomainCard.tsx  # Individual domain suggestion component
│   │   └── DomainSuggestions.tsx # Main domain management component
│   ├── services/
│   │   └── domainService.ts # API integration service
│   └── page.tsx            # Main application page
├── public/
└── ...config files

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for personal or commercial purposes.
