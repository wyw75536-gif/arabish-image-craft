import { useState, useEffect } from 'react';

interface UserStats {
  totalUsers: number;
  activeUsers: number;
}

const INITIAL_TOTAL = 300000;
const INITIAL_ACTIVE_BASE = 50000;
const MIN_ACTIVE = 30000;
const MAX_ACTIVE = 100000;

// دالة لحساب الوقت منذ تاريخ ثابت (1 يناير 2024)
const getHoursSinceEpoch = () => {
  const epoch = new Date('2024-01-01T00:00:00Z').getTime();
  const now = Date.now();
  return Math.floor((now - epoch) / (1000 * 60 * 60)); // ساعات
};

// دالة لتوليد رقم عشوائي مستقر بناءً على الساعة
const seededRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

export const useUserStats = (): UserStats => {
  const [stats, setStats] = useState<UserStats>({
    totalUsers: INITIAL_TOTAL,
    activeUsers: INITIAL_ACTIVE_BASE
  });

  useEffect(() => {
    const calculateStats = () => {
      const hours = getHoursSinceEpoch();
      
      // حساب إجمالي المستخدمين (يزيد بمعدل 50-1500 كل ساعة)
      let totalIncrease = 0;
      for (let h = 0; h < hours; h++) {
        const hourlyIncrease = Math.floor(seededRandom(h * 1000) * 1450) + 50; // 50-1500
        totalIncrease += hourlyIncrease;
      }
      
      // حساب المستخدمين النشطين (يتذبذب بناءً على الوقت)
      const activeVariation = Math.sin(hours * 0.1) * 0.3 + 0.7; // بين 0.4 و 1.0
      const baseActive = MIN_ACTIVE + (MAX_ACTIVE - MIN_ACTIVE) * seededRandom(hours);
      const finalActive = Math.floor(baseActive * activeVariation);
      
      setStats({
        totalUsers: INITIAL_TOTAL + totalIncrease,
        activeUsers: Math.max(MIN_ACTIVE, finalActive)
      });
    };

    calculateStats();
    
    // تحديث كل دقيقة للتأكد من الدقة
    const interval = setInterval(calculateStats, 60000);
    
    return () => clearInterval(interval);
  }, []);

  return stats;
};