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
    const calculateTotalUsers = () => {
      const minutes = Math.floor(Date.now() / (1000 * 60 * 10)); // كل 10 دقائق
      let totalIncrease = 0;
      for (let m = 0; m < minutes; m++) {
        const increase = Math.floor(seededRandom(m * 1000) * 1450) + 50; // 50-1500
        totalIncrease += increase;
      }
      return INITIAL_TOTAL + totalIncrease;
    };

    const calculateActiveUsers = () => {
      const minutes = Math.floor(Date.now() / (1000 * 60)); // كل دقيقة
      const activeVariation = Math.sin(minutes * 0.1) * 0.3 + 0.7;
      const baseActive = MIN_ACTIVE + (MAX_ACTIVE - MIN_ACTIVE) * seededRandom(minutes);
      return Math.max(MIN_ACTIVE, Math.floor(baseActive * activeVariation));
    };

    const updateStats = () => {
      setStats({
        totalUsers: calculateTotalUsers(),
        activeUsers: calculateActiveUsers()
      });
    };

    // تحديث فوري
    updateStats();
    
    // تحديث المستخدمين النشطين كل دقيقة
    const activeInterval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        activeUsers: calculateActiveUsers()
      }));
    }, 60000);

    // تحديث الإجمالي كل 10 دقائق
    const totalInterval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        totalUsers: calculateTotalUsers()
      }));
    }, 600000);
    
    return () => {
      clearInterval(activeInterval);
      clearInterval(totalInterval);
    };
  }, []);

  return stats;
};