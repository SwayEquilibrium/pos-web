'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { SimpleBackButton } from '@/components/BackNavigation'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'admin' | 'manager' | 'cashier'
  active: boolean
  lastLogin?: string
  createdAt: string
}

export default function UserManagement() {
  const router = useRouter()
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  // Mock users data - in real app this would come from useUserManagement hook
  const [users] = useState<User[]>([
    {
      id: '1',
      email: 'admin@restaurant.dk',
      firstName: 'Thomas',
      lastName: 'Nielsen',
      role: 'admin',
      active: true,
      lastLogin: '2024-01-15T14:30:00Z',
      createdAt: '2024-01-01T10:00:00Z'
    },
    {
      id: '2',
      email: 'manager@restaurant.dk',
      firstName: 'Maria',
      lastName: 'Hansen',
      role: 'manager',
      active: true,
      lastLogin: '2024-01-15T13:45:00Z',
      createdAt: '2024-01-02T11:00:00Z'
    },
    {
      id: '3',
      email: 'kasper@restaurant.dk',
      firstName: 'Kasper',
      lastName: 'Andersen',
      role: 'cashier',
      active: true,
      lastLogin: '2024-01-15T12:15:00Z',
      createdAt: '2024-01-03T09:00:00Z'
    },
    {
      id: '4',
      email: 'inactive@restaurant.dk',
      firstName: 'Lars',
      lastName: 'Petersen',
      role: 'cashier',
      active: false,
      createdAt: '2024-01-04T14:00:00Z'
    }
  ])

  const [userForm, setUserForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'cashier' as const,
    password: '',
    confirmPassword: ''
  })

  const handleCreateUser = () => {
    // Implementation would create user via API
    console.log('Creating user:', userForm)
    setShowCreateUser(false)
    setUserForm({
      email: '',
      firstName: '',
      lastName: '',
      role: 'cashier',
      password: '',
      confirmPassword: ''
    })
  }

  const handleToggleUserStatus = (userId: string) => {
    // Implementation would toggle user active status via API
    console.log('Toggling user status:', userId)
  }

  const handleDeleteUser = (userId: string) => {
    if (confirm('Er du sikker på at du vil slette denne bruger?')) {
      // Implementation would delete user via API
      console.log('Deleting user:', userId)
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'default'
      case 'manager': return 'secondary'
      case 'cashier': return 'outline'
      default: return 'outline'
    }
  }

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrator'
      case 'manager': return 'Manager'
      case 'cashier': return 'Kassemedarbejder'
      default: return role
    }
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('da-DK', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 60) return `${diffInMinutes} min siden`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} timer siden`
    return `${Math.floor(diffInMinutes / 1440)} dage siden`
  }

  return (
    <div className="p-6 space-y-6">
      {/* Back Navigation */}
      <SimpleBackButton onBack={() => router.push('/modules')} />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Brugere</h1>
          <p className="text-muted-foreground">Administrer brugere og deres roller</p>
        </div>
        <Button 
          onClick={() => setShowCreateUser(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          👤 Opret Bruger
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-sm text-muted-foreground">Total Brugere</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{users.filter(u => u.active).length}</div>
            <p className="text-sm text-muted-foreground">Aktive Brugere</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{users.filter(u => u.role === 'admin').length}</div>
            <p className="text-sm text-muted-foreground">Administratorer</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{users.filter(u => u.lastLogin && new Date(u.lastLogin) > new Date(Date.now() - 24*60*60*1000)).length}</div>
            <p className="text-sm text-muted-foreground">Aktive i dag</p>
          </CardContent>
        </Card>
      </div>

      {/* Create User Form */}
      {showCreateUser && (
        <Card>
          <CardHeader>
            <CardTitle>Opret Ny Bruger</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="userEmail">Email *</Label>
                <Input
                  id="userEmail"
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="bruger@restaurant.dk"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="userRole">Rolle *</Label>
                <select
                  id="userRole"
                  className="w-full px-3 py-2 border rounded-md"
                  value={userForm.role}
                  onChange={(e) => setUserForm(prev => ({ ...prev, role: e.target.value as any }))}
                >
                  <option value="cashier">Kassemedarbejder</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="userFirstName">Fornavn *</Label>
                <Input
                  id="userFirstName"
                  value={userForm.firstName}
                  onChange={(e) => setUserForm(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="Fornavn"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="userLastName">Efternavn *</Label>
                <Input
                  id="userLastName"
                  value={userForm.lastName}
                  onChange={(e) => setUserForm(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Efternavn"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="userPassword">Adgangskode *</Label>
                <Input
                  id="userPassword"
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Minimum 6 tegn"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="userConfirmPassword">Bekræft Adgangskode *</Label>
                <Input
                  id="userConfirmPassword"
                  type="password"
                  value={userForm.confirmPassword}
                  onChange={(e) => setUserForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Gentag adgangskode"
                />
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Roller og rettigheder:</h4>
              <div className="text-sm space-y-1">
                <p><strong>Administrator:</strong> Fuld adgang til alle funktioner</p>
                <p><strong>Manager:</strong> Kan administrere menukort, se rapporter, men ikke brugere</p>
                <p><strong>Kassemedarbejder:</strong> Kan kun betjene POS systemet</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleCreateUser}>Opret Bruger</Button>
              <Button variant="outline" onClick={() => setShowCreateUser(false)}>Annuller</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Brugerliste</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map(user => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    user.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{user.firstName} {user.lastName}</h3>
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {getRoleDisplayName(user.role)}
                      </Badge>
                      {!user.active && (
                        <Badge variant="destructive">Inaktiv</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <div className="text-xs text-muted-foreground mt-1">
                      {user.lastLogin ? (
                        <span>Sidst aktiv: {getTimeAgo(user.lastLogin)}</span>
                      ) : (
                        <span>Aldrig logget ind</span>
                      )}
                      <span className="mx-2">•</span>
                      <span>Oprettet: {formatDateTime(user.createdAt)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setSelectedUser(user)}
                  >
                    Rediger
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleToggleUserStatus(user.id)}
                  >
                    {user.active ? 'Deaktiver' : 'Aktiver'}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-red-600 hover:text-red-700"
                    onClick={() => handleDeleteUser(user.id)}
                  >
                    Slet
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* User Details Modal (simplified) */}
      {selectedUser && (
        <Card>
          <CardHeader>
            <CardTitle>Rediger Bruger: {selectedUser.firstName} {selectedUser.lastName}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={selectedUser.email} readOnly className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Rolle</Label>
                <select className="w-full px-3 py-2 border rounded-md" defaultValue={selectedUser.role}>
                  <option value="cashier">Kassemedarbejder</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Fornavn</Label>
                <Input defaultValue={selectedUser.firstName} />
              </div>
              <div className="space-y-2">
                <Label>Efternavn</Label>
                <Input defaultValue={selectedUser.lastName} />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button>Gem Ændringer</Button>
              <Button variant="outline" onClick={() => setSelectedUser(null)}>Annuller</Button>
              <Button variant="outline">Send Nyt Password</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
