'use client';

import React from 'react';
import ReactCountUp from 'react-countup';

interface CountUpProps {
  to: number;
  from?: number;
  direction?: 'up' | 'down';
  delay?: number;
  duration?: number;
  className?: string;
  startWhen?: boolean;
  separator?: string;
  decimalPlaces?: number;
  onStart?: () => void;
  onEnd?: () => void;
}

export default function CountUp({
  to,
  from = 0,
  direction = 'up',
  delay = 0,
  duration = 2,
  className = '',
  startWhen = true,
  separator = '',
  decimalPlaces = 0,
  onStart,
  onEnd,
}: CountUpProps) {
  // 如果是向下计数，交换from和to
  const startValue = direction === 'down' ? to : from;
  const endValue = direction === 'down' ? from : to;

  // 用于确定是否开始动画
  const shouldStart = startWhen;

  return (
    <span className={className}>
      {shouldStart ? (
        <ReactCountUp
          start={startValue}
          end={endValue}
          delay={delay}
          duration={duration}
          separator={separator}
          decimals={decimalPlaces}
          onStart={onStart}
          onEnd={onEnd}
          preserveValue
        />
      ) : (
        startValue
      )}
    </span>
  );
}
