'use client'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Clock, Plus, Users, Calendar } from 'lucide-react'

export default function ShiftsPage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  // Mock shift data
  const shifts = [
    {
      id: '1',
      employee: 'Maria Hansen',
      role: 'Cashier',
      startTime: '08:00',
      endTime: '16:00',
      status: 'active',
      date: selectedDate
    },
    {
      id: '2',
      employee: 'Thomas Nielsen',
      role: 'Manager',
      startTime: '16:00',
      endTime: '23:00',
      status: 'active',
      date: selectedDate
    },
    {
      id: '3',
      employee: 'Anna Jensen',
      role: 'Kitchen',
      startTime: '10:00',
      endTime: '18:00',
      status: 'scheduled',
      date: selectedDate
    }
  ]

  const activeShifts = shifts.filter(shift => shift.status === 'active').length
  const totalEmployees = shifts.length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Staff Shifts</h1>
          <p className="text-gray-600 mt-2">Schedule staff shifts and manage workforce planning</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            Schedule
          </Button>
          <Button className="bg-cyan-600 hover:bg-cyan-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Shift
          </Button>
        </div>
      </div>

      {/* Date Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Label className="text-sm font-medium">Select Date:</Label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-40"
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4" />
              Active Shifts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-600">{activeShifts}</div>
            <div className="text-xs text-gray-600 mt-1">Currently working</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Total Staff
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalEmployees}</div>
            <div className="text-xs text-gray-600 mt-1">Scheduled today</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Coverage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">100%</div>
            <div className="text-xs text-gray-600 mt-1">All positions covered</div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Shifts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Today's Shifts - {new Date(selectedDate).toLocaleDateString()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {shifts.map((shift) => (
              <div key={shift.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-cyan-600" />
                  </div>
                  <div>
                    <p className="font-medium">{shift.employee}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>{shift.role}</span>
                      <span>•</span>
                      <span>{shift.startTime} - {shift.endTime}</span>
                    </div>
                  </div>
                </div>
                <Badge variant={shift.status === 'active' ? 'default' : 'secondary'}>
                  {shift.status === 'active' ? 'Active' : 'Scheduled'}
                </Badge>
              </div>
            ))}
          </div>
          <Button variant="outline" className="w-full mt-4">
            View All Shifts
          </Button>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Plus className="w-5 h-5" />
              <span className="text-sm">New Shift</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Users className="w-5 h-5" />
              <span className="text-sm">Assign Staff</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Calendar className="w-5 h-5" />
              <span className="text-sm">Weekly View</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Clock className="w-5 h-5" />
              <span className="text-sm">Time Clock</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}