import React from 'react';
import Layout from '@/shared/ui/Layout/Layout';
import UpcomingFixtures from '@/features/fixtures/UpcomingFixtures';
import '../shared/ui/styles/UpcomingPage.css';

const UpcomingPage = () => {
  return (
    <Layout>
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">
            <span className="upcoming-icon">🟡</span>
            Предстоящие матчи (2025)
          </h1>
          <p className="page-description">
            Расписание футбольных матчей и турниров 2025 года по московскому времени
          </p>
        </div>
        
        <UpcomingFixtures days={30} />
      </div>
    </Layout>
  );
};

export default UpcomingPage;