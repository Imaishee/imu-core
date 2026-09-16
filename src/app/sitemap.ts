import { MetadataRoute } from 'next';

const BASE_URL = 'https://imu-core.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    '', '/syllabus', '/games', '/leaderboard', '/levels',
    '/prep', '/timetable', '/videos', '/profile', '/settings',
  ];

  return routes.map((route) => ({
    url: BASE_URL + route,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1 : 0.8,
  }));
}
