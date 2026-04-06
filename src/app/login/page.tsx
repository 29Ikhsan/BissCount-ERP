'use client';

import { useState } from 'react';
import { ArrowRight, Lock, Mail, ShieldCheck, BrainCircuit } from 'lucide-react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import styles from './page.module.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    
    const result = await signIn('credentials', {
      redirect: false,
      email,
      password
    });

    if (result?.error) {
      setErrorMsg('Invalid credentials. Please check your email and password.');
      setLoading(false);
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.leftPanel}>
        <div className={styles.brand}>
          <div className={styles.brandText}>
            <span className={styles.brandName}>AKSIA</span>
            <span className={styles.brandSubtitle}>ERP Powered by Artifical Intelegence</span>
          </div>
        </div>
        
        <div className={styles.heroContent}>
           <h1 className={styles.heroTitle}>Intelligent Finance & ERP for the Modern Enterprise</h1>
           <p className={styles.heroSubtitle}>Streamline accounting, manage supply chains, and leverage AI-powered FP&A analytics in one unified ledger.</p>
           
           <div className={styles.testimonialBox}>
              <div className={styles.stars}>★★★★★</div>
              <p className={styles.quote}>"Since transitioning to AKSIA, our month-end close time dropped from 8 days to just 2. The compliance checks and automated journaling are game changers."</p>
              <div className={styles.author}>
                 <strong>Sarah Jenkins</strong>
                 <span>CFO, Global Tech Solutions</span>
              </div>
           </div>
        </div>
        
        <div className={styles.secFooter}>
          <ShieldCheck size={16} /> SOC 2 Type II Certified | Bank-grade AES-256 Encryption
        </div>
      </div>

      <div className={styles.rightPanel}>
        <div className={styles.loginBox}>
          <div className={styles.aiHeader}>
            <BrainCircuit className={styles.aiIcon} />
            <h3 className={styles.aiTitle}>AKSIA Intelligence</h3>
          </div>
          <div className={styles.loginHeader}>
            <h2 className={styles.loginTitle}>Welcome back</h2>
            <p className={styles.loginSubtitle}>Please enter your details to sign in.</p>
          </div>

          <form onSubmit={handleLogin} className={styles.loginForm}>
            {errorMsg && (
              <div style={{ backgroundColor: '#FEE2E2', color: '#B91C1C', padding: '10px 14px', borderRadius: '6px', fontSize: '0.9rem', marginBottom: '16px' }}>
                {errorMsg}
              </div>
            )}
            
            <div className={styles.inputGroup}>
              <label>Professional Email</label>
              <div className={styles.inputWrapper}>
                <Mail className={styles.inputIcon} size={18} />
                <input 
                  type="email" 
                  required 
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={styles.inputField} 
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <div className={styles.passwordHeader}>
                <label>Password</label>
                <Link href="#" className={styles.forgotLink}>Forgot password?</Link>
              </div>
              <div className={styles.inputWrapper}>
                <Lock className={styles.inputIcon} size={18} />
                <input 
                  type="password" 
                  required 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={styles.inputField} 
                />
              </div>
            </div>

            <button type="submit" className={styles.loginBtn} disabled={loading}>
              {loading ? 'Authenticating...' : 'Sign in to workspace'} 
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          <div className={styles.signupPrompt}>
            Don't have an enterprise account? <Link href="#" className={styles.signupLink}>Contact Sales</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
