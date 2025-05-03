import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainPage from '../pages/MainPage';
import LivePage from '../pages/LivePage';
import UpcomingPage from '../pages/UpcomingPage';
import FinishedPage from '../pages/FinishedPage';
import TeamsPage from '../pages/TeamsPage';

const Router = () => {
  return (
    <Routes>
      <Route path="/" element={<MainPage />} />
      <Route path="/live" element={<LivePage />} />
      <Route path="/upcoming" element={<UpcomingPage />} />
      <Route path="/finished" element={<FinishedPage />} />
      <Route path="/teams" element={<TeamsPage />} />
    </Routes>
  );
};

export default Router;