import React from 'react';
import Layout from '@/shared/ui/Layout/Layout';
import LiveFixtures from '@/features/fixtures/LiveFixtures';
import '../shared/ui/styles/LivePage.css';

const LivePage = () => {
  return (
    <Layout>
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">
            <span className="live-dot"></span> 
            Матчи в прямом эфире
          </h1>
          <p className="page-description">
            Следите за ходом футбольных матчей в режиме реального времени с использованием вашего часового пояса
          </p>
        </div>

        <LiveFixtures />
      </div>
    </Layout>
  );
};

export default LivePage;