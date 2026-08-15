import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import HotelCard from '../components/HotelCard';

describe('HotelCard Component Unit Tests', () => {
  const sampleHotel = {
    _id: 'hotel123',
    name: 'Grand Horizon Resort',
    city: 'Goa',
    location: 'Calangute, North Goa',
    description: 'Luxury oceanfront resort with pool.',
    images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945'],
    startingPrice: 5000,
    averageRating: 4.8,
    reviewCount: 24,
    amenities: ['Pool', 'WiFi', 'Beach Access'],
  };

  it('should render hotel title, location, starting price, and rating score', () => {
    render(
      <BrowserRouter>
        <HotelCard hotel={sampleHotel} />
      </BrowserRouter>
    );

    expect(screen.getByText('Grand Horizon Resort')).toBeInTheDocument();
    expect(screen.getByText('Calangute, North Goa')).toBeInTheDocument();
    expect(screen.getByText(/₹5,000/)).toBeInTheDocument();
    expect(screen.getByText('4.8')).toBeInTheDocument();
    expect(screen.getByText('(24)')).toBeInTheDocument();
    expect(screen.getByText('Pool')).toBeInTheDocument();
  });
});
