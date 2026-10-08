
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Settings } from 'lucide-react';

interface UserProfileProps {
  cycleLength: number;
  onCycleLengthChange: (length: number) => void;
}

const UserProfile: React.FC<UserProfileProps> = ({
  cycleLength,
  onCycleLengthChange,
}) => {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center space-x-2">
          <User className="w-8 h-8 text-purple-600" />
          <h1 className="text-2xl font-bold text-gray-800">Profile</h1>
        </div>
        <p className="text-gray-600">Your data stays private on this device</p>
      </div>

      {/* Cycle Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>Cycle Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cycleLength">Average Cycle Length (days)</Label>
            <Input
              id="cycleLength"
              type="number"
              min="21"
              max="35"
              value={cycleLength}
              onChange={(e) => onCycleLengthChange(parseInt(e.target.value) || 28)}
              className="w-full"
            />
            <p className="text-sm text-gray-500">
              Typical cycles range from 21 to 35 days. The average is 28 days.
            </p>
          </div>
        </CardContent>
      </Card>

    </div>
  );
};

export default UserProfile;
