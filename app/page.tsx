'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import { 
  ShieldCheck, 
  Copy, 
  Check, 
  ArrowRight, 
  Smartphone, 
  QrCode, 
  AlertCircle, 
  CheckCircle2, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink,
  RefreshCw,
  Wallet
} from 'lucide-react';

const PRESET_AMOUNTS = [100, 200, 500, 1000, 2000, 5000];

function PaymentContent() {
  const searchParams = useSearchParams();

  // URL Query Params
  const queryAmount = searchParams.get('amount');
  const queryPhone = searchParams.get('phone') || searchParams.get('mobile');
  const queryUserId = searchParams.get('userId');
  const queryToken = searchParams.get('token');

  // State
  const [amount, setAmount] = useState<number>(queryAmount ? Math.max(10, parseFloat(queryAmount) || 500) : 500);
  const [customAmount, setCustomAmount] = useState<string>(queryAmount || '500');
  const [phone, setPhone] = useState<string>(queryPhone || '');
  const [utr, setUtr] = useState<string>('');
  const [upiDetails, setUpiDetails] = useState<{ upiId: string; upiName: string }>({
    upiId: 'crypto.bets@upi',
    upiName: 'Solidgame',
  });
  
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Fetch UPI details dynamically from backend
  useEffect(() => {
    async function fetchUpi() {
      try {
        const res = await fetch('/api/proxy/wallet/upi-details');
        if (res.ok) {
          const data = await res.json();
          if (data.upiId) {
            setUpiDetails({
              upiId: data.upiId,
              upiName: data.upiName || 'Solidgame',
            });
          }
        }
      } catch (e) {
        // Fallback to default
      }
    }
    fetchUpi();
  }, []);

  // Update amount from custom input
  const handleAmountSelect = (val: number) => {
    setAmount(val);
    setCustomAmount(val.toString());
    setErrorMsg(null);
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setCustomAmount(val);
    const num = parseInt(val, 10);
    if (!isNaN(num) && num > 0) {
      setAmount(num);
    }
    setErrorMsg(null);
  };

  // Build standard NPCI UPI URI
  const upiUri = `upi://pay?pa=${encodeURIComponent(upiDetails.upiId)}&pn=${encodeURIComponent(upiDetails.upiName)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent('Solidgame Deposit')}`;

  // Generate QR code whenever UPI URI changes
  useEffect(() => {
    if (!upiUri) return;
    QRCode.toDataURL(upiUri, {
      width: 280,
      margin: 2,
      color: {
        dark: '#ffffff',
        light: '#121216',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('QR generation failed', err));
  }, [upiUri]);

  // Copy UPI ID to clipboard
  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiDetails.upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  // Submit UTR verification
  const handleSubmitDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanUtr = utr.trim().toUpperCase();
    const cleanPhone = phone.replace(/[^0-9]/g, '').slice(-10);

    if (amount < 10) {
      setErrorMsg('Minimum deposit amount is ₹10');
      return;
    }
    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit registered mobile number');
      return;
    }
    if (!cleanUtr || cleanUtr.length < 6) {
      setErrorMsg('Please enter a valid 12-digit UPI UTR / Reference number');
      return;
    }

    setLoading(true);

    try {
      // If token is provided in query params, use authenticated endpoint
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      let endpoint = '/api/proxy/wallet/public-deposit-request';
      let payload: any = {
        amount,
        phone: cleanPhone,
        utrNumber: cleanUtr,
      };

      if (queryToken) {
        headers['Authorization'] = `Bearer ${queryToken}`;
        endpoint = '/api/proxy/wallet/deposit-request';
        payload = { amount, utrNumber: cleanUtr };
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit deposit request. Please try again.');
      }

      setSuccessData({
        amount,
        utr: cleanUtr,
        phone: cleanPhone,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        depositId: data.deposit?.id || 'SUB-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      });

      // Confetti celebration
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#10b981', '#ffffff', '#38bdf8'],
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error occurred. Please verify your connection.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSuccessData(null);
    setUtr('');
    setErrorMsg(null);
  };

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', padding: '24px 16px', width: '100%' }}>
      {/* Header */}
      <header style={{ textAlign: 'center', marginBottom: '28px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <div style={{ 
            width: '36px', 
            height: '36px', 
            borderRadius: '10px', 
            background: 'linear-gradient(135deg, #6366f1, #3b82f6)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)'
          }}>
            <Wallet size={20} color="#fff" />
          </div>
          <span style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.5px' }}>
            SOLID<span style={{ color: '#6366f1' }}>GAME</span> <span style={{ fontSize: '13px', fontWeight: 600, color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>PAY</span>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#9494a8', fontSize: '12px' }}>
          <ShieldCheck size={14} color="#10b981" />
          <span>NPCI 256-Bit Bank-Grade Secure Payment Gateway</span>
        </div>
      </header>

      {/* Success Confirmation View */}
      {successData ? (
        <div className="glass-card fade-in" style={{ padding: '32px 24px', textAlign: 'center' }}>
          <div style={{ 
            width: '64px', 
            height: '64px', 
            borderRadius: '50%', 
            background: 'rgba(16, 185, 129, 0.15)', 
            border: '2px solid #10b981', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            margin: '0 auto 20px auto'
          }}>
            <CheckCircle2 size={36} color="#10b981" />
          </div>

          <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>Deposit Request Submitted!</h2>
          <p style={{ color: '#9494a8', fontSize: '14px', lineHeight: 1.5, marginBottom: '24px' }}>
            Your transaction has been submitted for admin verification. Your Solidgame balance will update automatically within <strong style={{ color: '#f4f4f6' }}>1–2 minutes</strong>.
          </p>

          <div style={{ 
            background: '#0e0e12', 
            borderRadius: '12px', 
            padding: '16px', 
            border: '1px solid #22222d',
            marginBottom: '24px',
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid #1b1b22', fontSize: '13px' }}>
              <span style={{ color: '#9494a8' }}>Deposit Amount</span>
              <span style={{ fontWeight: 700, color: '#10b981', fontSize: '16px' }}>₹{successData.amount.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #1b1b22', fontSize: '13px' }}>
              <span style={{ color: '#9494a8' }}>UTR Number</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{successData.utr}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #1b1b22', fontSize: '13px' }}>
              <span style={{ color: '#9494a8' }}>Registered Mobile</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>+91 {successData.phone}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '10px', fontSize: '13px' }}>
              <span style={{ color: '#9494a8' }}>Submission Time</span>
              <span style={{ color: '#9494a8' }}>{successData.timestamp}</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <a 
              href="solidgame://wallet"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                color: '#fff',
                padding: '14px',
                borderRadius: '12px',
                fontWeight: 600,
                textDecoration: 'none',
                boxShadow: '0 4px 16px rgba(99, 102, 241, 0.35)',
              }}
            >
              <span>Return to Solidgame App</span>
              <ArrowRight size={16} />
            </a>

            <button
              onClick={resetForm}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                background: 'transparent',
                color: '#9494a8',
                padding: '12px',
                borderRadius: '12px',
                fontSize: '13px',
                border: '1px solid #272733',
              }}
            >
              <RefreshCw size={14} />
              <span>Make Another Deposit</span>
            </button>
          </div>
        </div>
      ) : (
        /* Payment Steps View */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* STEP 1: Select Amount */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ 
                  width: '24px', 
                  height: '24px', 
                  borderRadius: '50%', 
                  background: '#6366f1', 
                  color: '#fff', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 700 
                }}>1</div>
                <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Select Deposit Amount</h3>
              </div>
              <span style={{ fontSize: '13px', color: '#10b981', fontWeight: 600 }}>0% Processing Fee</span>
            </div>

            {/* Presets */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '14px' }}>
              {PRESET_AMOUNTS.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleAmountSelect(val)}
                  style={{
                    padding: '12px 8px',
                    borderRadius: '10px',
                    background: amount === val ? '#6366f1' : '#181820',
                    color: amount === val ? '#ffffff' : '#f4f4f6',
                    border: `1px solid ${amount === val ? '#818cf8' : '#272733'}`,
                    fontWeight: 700,
                    fontSize: '14px',
                    transition: 'all 0.15s ease',
                    boxShadow: amount === val ? '0 0 12px rgba(99, 102, 241, 0.4)' : 'none',
                  }}
                >
                  ₹{val}
                </button>
              ))}
            </div>

            {/* Custom Amount Field */}
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9494a8', fontWeight: 700, fontSize: '16px' }}>₹</span>
              <input
                type="text"
                inputMode="numeric"
                value={customAmount}
                onChange={handleCustomAmountChange}
                placeholder="Enter custom amount"
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 32px',
                  background: '#0d0d10',
                  border: '1px solid #272733',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '15px',
                  fontWeight: 600,
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* STEP 2: Pay via UPI */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <div style={{ 
                width: '24px', 
                height: '24px', 
                borderRadius: '50%', 
                background: '#6366f1', 
                color: '#fff', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 700 
              }}>2</div>
              <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Scan QR or Pay with UPI App</h3>
            </div>

            {/* QR Code Container */}
            <div style={{ 
              background: '#121216', 
              borderRadius: '14px', 
              padding: '16px', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              border: '1px solid #22222d',
              marginBottom: '16px',
            }}>
              {qrDataUrl ? (
                <div style={{ 
                  background: '#fff', 
                  padding: '10px', 
                  borderRadius: '10px', 
                  boxShadow: '0 0 20px rgba(99, 102, 241, 0.25)',
                  marginBottom: '10px'
                }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrDataUrl} alt="UPI QR Code" style={{ width: '200px', height: '200px', display: 'block' }} />
                </div>
              ) : (
                <div style={{ width: '200px', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9494a8' }}>
                  <QrCode size={40} className="pulse-glow" />
                </div>
              )}
              
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '13px', color: '#9494a8' }}>Amount to Pay: </span>
                <span style={{ fontSize: '18px', fontWeight: 800, color: '#10b981' }}>₹{amount.toFixed(2)}</span>
              </div>
              <span style={{ fontSize: '11px', color: '#646478', marginTop: '4px' }}>Accepts GPay, PhonePe, Paytm, CRED & all banks</span>
            </div>

            {/* 1-Click Pay Buttons for Mobile */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '16px' }}>
              <a
                href={upiUri}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  background: '#1a1a24',
                  border: '1px solid #2a2a38',
                  borderRadius: '10px',
                  padding: '12px',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                <Smartphone size={16} color="#6366f1" />
                <span>Open UPI App</span>
              </a>

              <a
                href={upiUri}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  background: '#1a1a24',
                  border: '1px solid #2a2a38',
                  borderRadius: '10px',
                  padding: '12px',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                <ExternalLink size={14} color="#10b981" />
                <span>Pay ₹{amount}</span>
              </a>
            </div>

            {/* Copy UPI ID */}
            <div style={{ 
              background: '#0d0d11', 
              borderRadius: '10px', 
              padding: '10px 14px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              border: '1px dashed #272733',
            }}>
              <div>
                <div style={{ fontSize: '10px', color: '#646478', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Solidgame Official UPI ID</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600, color: '#f4f4f6' }}>{upiDetails.upiId}</div>
              </div>
              <button
                type="button"
                onClick={handleCopyUpi}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: copiedUpi ? 'rgba(16, 185, 129, 0.2)' : 'rgba(99, 102, 241, 0.15)',
                  color: copiedUpi ? '#10b981' : '#818cf8',
                  border: `1px solid ${copiedUpi ? '#10b981' : 'rgba(99, 102, 241, 0.3)'}`,
                  borderRadius: '8px',
                  padding: '6px 10px',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                {copiedUpi ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedUpi ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* STEP 3: Enter UTR / Ref No */}
          <form onSubmit={handleSubmitDeposit} className="glass-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <div style={{ 
                width: '24px', 
                height: '24px', 
                borderRadius: '50%', 
                background: '#6366f1', 
                color: '#fff', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 700 
              }}>3</div>
              <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Verify Deposit (Enter 12-Digit UTR)</h3>
            </div>

            {errorMsg && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                background: 'rgba(244, 63, 94, 0.1)', 
                border: '1px solid rgba(244, 63, 94, 0.3)', 
                color: '#f43f5e', 
                padding: '10px 12px', 
                borderRadius: '8px', 
                fontSize: '12px',
                marginBottom: '14px' 
              }}>
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Mobile Number Field */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#9494a8', marginBottom: '6px' }}>
                Your Registered Mobile Number
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9494a8', fontSize: '13px', fontWeight: 600 }}>+91</span>
                <input
                  type="tel"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="Enter 10-digit mobile number"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 46px',
                    background: '#0d0d10',
                    border: '1px solid #272733',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '14px',
                    fontFamily: 'var(--font-mono)',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* UTR Input Field */}
            <div style={{ marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', color: '#9494a8' }}>
                  12-Digit UPI Ref / UTR Number
                </label>
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === 1 ? null : 1)}
                  style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#6366f1', fontSize: '11px', textDecoration: 'underline' }}
                >
                  <HelpCircle size={12} />
                  <span>Where is UTR?</span>
                </button>
              </div>
              <input
                type="text"
                maxLength={22}
                value={utr}
                onChange={(e) => setUtr(e.target.value.toUpperCase())}
                placeholder="e.g. 427819381920"
                required
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  background: '#0d0d10',
                  border: '1px solid #272733',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '14px',
                  letterSpacing: '1px',
                  fontFamily: 'var(--font-mono)',
                  outline: 'none',
                }}
              />
              <span style={{ display: 'block', fontSize: '11px', color: '#646478', marginTop: '4px' }}>
                Found in payment receipt of PhonePe, GPay, Paytm, or your banking app.
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: loading ? '#4f46e5' : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                color: '#fff',
                padding: '14px',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '15px',
                boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="pulse-glow" />
                  <span>Submitting & Verifying...</span>
                </>
              ) : (
                <>
                  <span>Submit Deposit Verification</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Help & FAQ */}
          <div className="glass-card" style={{ padding: '16px 20px' }}>
            <div 
              onClick={() => setOpenFaq(openFaq === 1 ? null : 1)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: '#f4f4f6' }}>
                <HelpCircle size={15} color="#6366f1" />
                <span>How to find 12-digit UTR Number?</span>
              </div>
              {openFaq === 1 ? <ChevronUp size={16} color="#9494a8" /> : <ChevronDown size={16} color="#9494a8" />}
            </div>

            {openFaq === 1 && (
              <div className="fade-in" style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #22222d', fontSize: '12px', color: '#9494a8', lineHeight: 1.6 }}>
                <p>• <strong>PhonePe:</strong> Open History → Select payment → Tap &quot;UTR: 4xxxxxxxxxxx&quot; to copy.</p>
                <p style={{ marginTop: '4px' }}>• <strong>Google Pay:</strong> Tap Transaction Details → Look for &quot;UPI transaction ID&quot; (12 digits).</p>
                <p style={{ marginTop: '4px' }}>• <strong>Paytm:</strong> Go to Passbook/History → Select payment → Look for &quot;UPI Ref No&quot;.</p>
                <p style={{ marginTop: '4px' }}>• <strong>Other Banks:</strong> Look for Ref No. or RRN number in SMS or bank statement.</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <footer style={{ textAlign: 'center', color: '#646478', fontSize: '11px', padding: '10px 0 20px 0' }}>
            <p>© {new Date().getFullYear()} Solidgame. All rights reserved.</p>
            <p style={{ marginTop: '4px' }}>Instant Automated UPI Settlement Gateway • 100% Legally Compliant</p>
          </footer>
        </div>
      )}
    </div>
  );
}

export default function PaymentPage() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <Suspense fallback={
        <div style={{ color: '#9494a8', display: 'flex', alignItems: 'center', gap: '8px', padding: '40px' }}>
          <RefreshCw size={18} className="pulse-glow" />
          <span>Loading secure payment gateway...</span>
        </div>
      }>
        <PaymentContent />
      </Suspense>
    </main>
  );
}
