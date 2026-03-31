'use client';

import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, 
  BrainCircuit, 
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import styles from './page.module.css';

// --- Dummy Data ---
const simulationData = [
  { name: 'Q1', Historical: 1100, ForecastBase: null, ForecastOptimistic: null },
  { name: 'Q2', Historical: 1250, ForecastBase: null, ForecastOptimistic: null },
  { name: 'Q3', Historical: 1400, ForecastBase: 1400, ForecastOptimistic: 1400 },
  { name: 'Q4', Historical: null, ForecastBase: 1550, ForecastOptimistic: 1800 },
  { name: 'Q1 2024', Historical: null, ForecastBase: 1620, ForecastOptimistic: 2000 },
  { name: 'Q2 2024', Historical: null, ForecastBase: 1750, ForecastOptimistic: 2300 },
];

export default function FPA_Analytics() {
  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>FP&A Analytics & Forecasting</h1>
          <p className={styles.pageSubtitle}>Financial Planning & Analysis powered by predictive machine learning models.</p>
        </div>
      </div>

      <div className={styles.mainLayout}>
        {/* Left Column: Metrics & AI Chat */}
        <div className={styles.leftCol}>
          <div className={styles.metricsGrid}>
            <div className={styles.metricCard}>
              <div className={styles.metricHeader}>
                <span className={styles.metricLabel}>PREDICTED Q4 REVENUE</span>
                <TrendingUp size={16} className={styles.iconGreen} />
              </div>
              <div className={styles.metricValue}>$1.55M</div>
              <div className={styles.metricTrend}>
                <ArrowUpRight size={14} /> +12% from base scenario
              </div>
            </div>

            <div className={styles.metricCard}>
              <div className={styles.metricHeader}>
                <span className={styles.metricLabel}>RISK EXPOSURE (COGS)</span>
                <Activity size={16} className={styles.iconRed} />
              </div>
              <div className={styles.metricValue}>18.4%</div>
              <div className={styles.metricTrendRed}>
                <ArrowDownRight size={14} /> Driven by material cost inflation
              </div>
            </div>
          </div>

          <div className={styles.aiPanel}>
            <div className={styles.aiHeader}>
              <div className={styles.aiTitleBox}>
                <BrainCircuit size={20} className={styles.aiIcon} />
                <h3 className={styles.aiTitle}>Bizzcount AI Analyst</h3>
              </div>
              <div className={styles.aiBadge}>ACTIVE</div>
            </div>
            
            <div className={styles.chatArea}>
               <div className={styles.chatBubbleSystem}>
                 Based on the Q3 trend data and historical seasonality, I have generated the baseline and optimistic revenue forecasts for the next 3 quarters. Would you like me to simulate a supply chain disruption scenario?
               </div>
               
               <div className={styles.chatOptions}>
                 <button className={styles.chatOptionBtn}>Simulate 15% COGS Increase</button>
                 <button className={styles.chatOptionBtn}>Calculate Burn Rate Runway</button>
                 <button className={styles.chatOptionBtn}>Analyze Top Customers</button>
               </div>
            </div>
            
            <div className={styles.chatInputBox}>
               <input type="text" placeholder="Ask the AI Analyst a question..." className={styles.chatInput} />
               <button className={styles.chatSendBtn}>Ask</button>
            </div>
          </div>
        </div>

        {/* Right Column: Main Visualizations */}
        <div className={styles.rightCol}>
          <div className={styles.chartCardFull}>
            <div className={styles.chartHeader}>
              <div>
                <h3 className={styles.chartTitle}>Revenue Prediction Model</h3>
                <p className={styles.chartSubtitle}>Historical data vs Bayesian predictive scenarios</p>
              </div>
              <div className={styles.legendGroup}>
                <span className={styles.legendItem}><span className={styles.dotHist}></span> Historical</span>
                <span className={styles.legendItem}><span className={styles.dotBase}></span> Base Forecast</span>
                <span className={styles.legendItem}><span className={styles.dotOpt}></span> Optimistic Zone</span>
              </div>
            </div>
            
            <div className={styles.chartContainer}>
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={simulationData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorHist" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#94A3B8" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#94A3B8" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorOpt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" tick={{fontSize: 12, fill: '#64748B'}} tickLine={false} axisLine={false} dy={10} />
                  <YAxis hide />
                  <RechartsTooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}} />
                  <Area type="monotone" dataKey="Historical" stroke="#64748B" strokeWidth={3} fillOpacity={1} fill="url(#colorHist)" />
                  <Area type="monotone" dataKey="ForecastOptimistic" stroke="#3B82F6" strokeDasharray="5 5" strokeWidth={2} fillOpacity={1} fill="url(#colorOpt)" />
                  <Area type="monotone" dataKey="ForecastBase" stroke="#0F3B8C" strokeDasharray="3 3" strokeWidth={3} fill="none" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={styles.scenarioGrid}>
             <div className={styles.scenarioCard}>
               <h4 className={styles.scenarioTitle}>Cash Flow Runway</h4>
               <p className={styles.scenarioDesc}>At current Monthly Recurring Revenue (MRR) and burn rate.</p>
               <div className={styles.runwayValue}>18.5 Months</div>
               <div className={styles.progressBarBg}><div className={styles.progressBarFill} style={{width: '75%'}}></div></div>
             </div>
             
             <div className={styles.scenarioCard}>
               <h4 className={styles.scenarioTitle}>YoY Growth Confidence</h4>
               <p className={styles.scenarioDesc}>Probability of hitting 20% Year-over-Year revenue target.</p>
               <div className={styles.confidenceValue}>82%</div>
               <div className={styles.progressBarBg}><div className={styles.progressBarFillGreen} style={{width: '82%'}}></div></div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
