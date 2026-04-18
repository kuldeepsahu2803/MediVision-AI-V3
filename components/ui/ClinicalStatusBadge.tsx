
import React from 'react';
import { Badge } from './Badge.tsx';
import { 
  CheckCircle2, 
  AlertCircle, 
  FileEdit, 
  Search, 
  Clock, 
  ShieldCheck,
  Zap,
  Activity
} from 'lucide-react';

export type ClinicalStatus = 
  | 'AI-Extracted' 
  | 'User-Corrected' 
  | 'Clinically-Verified' 
  | 'Pending' 
  | 'Review' 
  | 'Invalid' 
  | 'Normal' 
  | 'Low' 
  | 'High' 
  | 'Critical';

interface ClinicalStatusBadgeProps {
  status: ClinicalStatus;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
  animate?: boolean;
}

export const ClinicalStatusBadge: React.FC<ClinicalStatusBadgeProps> = ({ 
  status, 
  size = 'sm', 
  className = '',
  animate = false
}) => {
  const config: Record<ClinicalStatus, { variant: any; icon: any; label: string }> = {
    'AI-Extracted': { 
      variant: 'info', 
      icon: <Zap className="w-full h-full" />, 
      label: 'AI Extracted' 
    },
    'User-Corrected': { 
      variant: 'warning', 
      icon: <FileEdit className="w-full h-full" />, 
      label: 'Corrected' 
    },
    'Clinically-Verified': { 
      variant: 'success', 
      icon: <ShieldCheck className="w-full h-full" />, 
      label: 'Verified' 
    },
    'Pending': { 
      variant: 'neutral', 
      icon: <Clock className="w-full h-full" />, 
      label: 'Pending' 
    },
    'Review': { 
      variant: 'warning', 
      icon: <Search className="w-full h-full" />, 
      label: 'Review' 
    },
    'Invalid': { 
      variant: 'error', 
      icon: <AlertCircle className="w-full h-full" />, 
      label: 'Invalid' 
    },
    'Normal': { 
      variant: 'success', 
      icon: <CheckCircle2 className="w-full h-full" />, 
      label: 'Normal' 
    },
    'Low': { 
      variant: 'info', 
      icon: <Activity className="w-full h-full translate-y-0.5" />, 
      label: 'Low' 
    },
    'High': { 
      variant: 'warning', 
      icon: <Activity className="w-full h-full -translate-y-0.5" />, 
      label: 'High' 
    },
    'Critical': { 
      variant: 'error', 
      icon: <AlertCircle className="w-full h-full" />, 
      label: 'Critical' 
    },
  };

  const { variant, icon, label } = config[status] || { 
    variant: 'neutral', 
    icon: <Activity className="w-full h-full" />, 
    label: status 
  };

  return (
    <Badge 
      variant={variant} 
      size={size} 
      className={className} 
      icon={<div className="w-3 h-3 flex items-center justify-center -ml-0.5">{icon}</div>}
      animate={animate}
    >
      {label}
    </Badge>
  );
};
