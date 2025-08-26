'use client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ModuleSkeleton } from '@/components/SkeletonLoader'
import SmoothButton from '@/components/SmoothButton'
import { 
  Building2, 
  Users, 
  UserCheck, 
  UtensilsCrossed, 
  Tags, 
  Link2,
  Warehouse,
  Clock,
  Calendar,
  Gift,
  TestTube,
  TrendingUp,
  Calculator,
  Receipt,
  Settings,
  Monitor,
  CreditCard,
  Printer,
  ClipboardList,
  Home,
  Table,
  ShoppingBag,
  ArrowLeft,
  Zap
} from 'lucide-react'
import { useTranslation } from '@/contexts/LanguageContext'

export default function ModulesPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading time for smooth transition
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [])

  const moduleCategories = [
    {
      category: t('business'),
      description: t('language') === 'da' ? 'Virksomhedsindstillinger og brugerstyring' : 'Business settings and user management',
      modules: [
        {
          id: 'company-settings',
          title: t('companySettings'),
          description: t('language') === 'da' ? 'Logo, virksomhedsoplysninger og sprog' : 'Logo, company information and language',
          icon: <Building2 className="w-6 h-6" />,
          href: '/admin/business/settings',
          color: 'bg-blue-500',
          badge: 'New'
        },
        {
          id: 'users',
          title: t('users'),
          description: t('language') === 'da' ? 'Administrer brugere og tilladelser' : 'Manage users and permissions',
          icon: <Users className="w-6 h-6" />,
          href: '/admin/business/users',
          color: 'bg-green-500'
        },
        {
          id: 'customer-groups',
          title: t('customerGroups'),
          description: t('language') === 'da' ? 'Kundegrupper og rabatter' : 'Customer groups and discounts',
          icon: <UserCheck className="w-6 h-6" />,
          href: '/admin/business/groups',
          color: 'bg-purple-500'
        }
      ]
    },
    {
      category: t('menuManagement'),
      description: t('language') === 'da' ? 'Administrer menuer, kategorier og produkter' : 'Manage menus, categories and products',
      modules: [
        {
          id: 'menu-editor',
          title: t('language') === 'da' ? 'Menu Editor' : 'Menu Editor',
          description: t('language') === 'da' ? 'Opret og rediger menuer, kategorier og produkter' : 'Create and edit menus, categories and products',
          icon: <UtensilsCrossed className="w-6 h-6" />,
          href: '/menu',
          color: 'bg-green-500',
          badge: 'Main'
        },
        {
          id: 'addons-modifiers',
          title: t('language') === 'da' ? 'Addons & Modifiers' : 'Addons & Modifiers',
          description: t('language') === 'da' ? 'Administrer tilvalg, varianter og ekstramuligheder' : 'Manage options, variants and extras',
          icon: <Tags className="w-6 h-6" />,
          href: '/menu/addons-modifiers',
          color: 'bg-blue-500',
          badge: 'Essential'
        }
      ]
    },
    {
      category: t('operations'),
      description: t('language') === 'da' ? 'Daglig drift og booking' : 'Daily operations and booking',
      modules: [
        {
          id: 'tables',
          title: t('tablesRooms'),
          description: t('language') === 'da' ? 'Bordopsætning og lokaler' : 'Table setup and rooms',
          icon: <Warehouse className="w-6 h-6" />,
          href: '/admin/operations/tables',
          color: 'bg-indigo-500'
        },
        {
          id: 'shifts',
          title: t('shifts'),
          description: t('language') === 'da' ? 'Vagtplaner og arbejdstider' : 'Shift schedules and work hours',
          icon: <Clock className="w-6 h-6" />,
          href: '/admin/operations/shifts',
          color: 'bg-teal-500'
        },
        {
          id: 'booking',
          title: t('booking'),
          description: t('language') === 'da' ? 'Bordreservationer og events' : 'Table reservations and events',
          icon: <Calendar className="w-6 h-6" />,
          href: '/admin/operations/booking',
          color: 'bg-pink-500'
        }
      ]
    },
    {
      category: t('sales'),
      description: t('language') === 'da' ? 'Salgsmoduler og betalinger' : 'Sales modules and payments',
      modules: [
        {
          id: 'gift-cards',
          title: t('giftCards'),
          description: t('language') === 'da' ? 'Gavekort og vouchers' : 'Gift cards and vouchers',
          icon: <Gift className="w-6 h-6" />,
          href: '/admin/sales/gift-cards',
          color: 'bg-emerald-500'
        },
        {
          id: 'test-payments',
          title: t('testPayments'),
          description: t('language') === 'da' ? 'Test betalingssystemer' : 'Test payment systems',
          icon: <TestTube className="w-6 h-6" />,
          href: '/admin/sales/test-payments',
          color: 'bg-amber-500'
        }
      ]
    },
    {
      category: t('economy'),
      description: t('language') === 'da' ? 'Økonomi og rapportering' : 'Economy and reporting',
      modules: [
        {
          id: 'reports',
          title: t('reports'),
          description: t('language') === 'da' ? 'Salgsrapporter og analyser' : 'Sales reports and analytics',
          icon: <TrendingUp className="w-6 h-6" />,
          href: '/admin/economy/reports',
          color: 'bg-cyan-500'
        },
        {
          id: 'accounting',
          title: t('accounting'),
          description: t('language') === 'da' ? 'Kasseopstilling og Z-rapport' : 'Cash register and Z-reports',
          icon: <Calculator className="w-6 h-6" />,
          href: '/admin/economy/accounting',
          color: 'bg-violet-500'
        },
        {
          id: 'vat',
          title: t('vatAccounting'),
          description: t('language') === 'da' ? 'Moms og regnskab' : 'VAT and accounting',
          icon: <Receipt className="w-6 h-6" />,
          href: '/admin/economy/vat',
          color: 'bg-rose-500'
        }
      ]
    },
    {
      category: t('system'),
      description: t('language') === 'da' ? 'Systemindstillinger og konfiguration' : 'System settings and configuration',
      modules: [
        {
          id: 'display',
          title: t('screenLayout'),
          description: t('language') === 'da' ? 'Skærmlayout og visningsindstillinger' : 'Screen layout and display settings',
          icon: <Monitor className="w-6 h-6" />,
          href: '/admin/system/display',
          color: 'bg-slate-500'
        },
        {
          id: 'payment-methods',
          title: t('paymentMethods'),
          description: t('language') === 'da' ? 'Betalingsmetoder og integration' : 'Payment methods and integration',
          icon: <CreditCard className="w-6 h-6" />,
          href: '/admin/system/payment',
          color: 'bg-gray-500'
        },
        {
          id: 'printers',
          title: t('printers'),
          description: t('language') === 'da' ? 'Printer opsætning og konfiguration' : 'Printer setup and configuration',
          icon: <Printer className="w-6 h-6" />,
          href: '/admin/system/printers',
          color: 'bg-zinc-500'
        },
        {
          id: 'activity',
          title: t('activityLog'),
          description: t('language') === 'da' ? 'Aktivitetslog og audit trail' : 'Activity log and audit trail',
          icon: <ClipboardList className="w-6 h-6" />,
          href: '/admin/system/activity',
          color: 'bg-stone-500'
        }
      ]
    }
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="text-center">
            <div className="h-10 bg-gray-200 rounded w-48 mx-auto mb-4 animate-pulse"></div>
            <div className="h-6 bg-gray-200 rounded w-96 mx-auto animate-pulse"></div>
          </div>
          <ModuleSkeleton />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in-50 duration-300">

        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">{t('modules')}</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('language') === 'da' 
              ? 'Administrer alle aspekter af din restaurant gennem disse organiserede moduler'
              : 'Manage all aspects of your restaurant through these organized modules'
            }
          </p>
        </div>

        {/* Module Categories */}
        {moduleCategories.map((category, categoryIndex) => (
          <div key={categoryIndex} className="space-y-4">
            <div className="border-l-4 border-primary pl-4">
              <h2 className="text-2xl font-semibold">{category.category}</h2>
              <p className="text-muted-foreground">{category.description}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {category.modules.map((module) => (
                <Card 
                  key={module.id} 
                  className="hover:shadow-lg transition-all duration-300 ease-out cursor-pointer group hover:scale-[1.02] hover:-translate-y-1 active:scale-[0.98] active:translate-y-0"
                  onClick={() => {
                    setTimeout(() => router.push(module.href), 100)
                  }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className={`p-3 rounded-lg ${module.color} text-white group-hover:scale-110 transition-transform`}>
                        {module.icon}
                      </div>
                      {module.badge && (
                        <Badge variant="secondary" className="text-xs">
                          {module.badge}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      {module.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {module.description}
                    </p>
                    <SmoothButton 
                      variant="outline" 
                      size="sm" 
                      className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-200"
                    >
                      {t('language') === 'da' ? 'Åbn modul' : 'Open module'}
                    </SmoothButton>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}

        {/* Quick Access */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              {t('language') === 'da' ? 'Hurtig adgang' : 'Quick Access'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <SmoothButton 
                variant="outline" 
                className="h-20 flex-col gap-2 hover:scale-105 transition-all duration-200"
                onClick={() => router.push('/admin/business/settings')}
              >
                <Building2 className="w-6 h-6" />
                <span className="text-xs">{t('companySettings')}</span>
              </SmoothButton>
              <SmoothButton 
                variant="outline" 
                className="h-20 flex-col gap-2 hover:scale-105 transition-all duration-200"
                onClick={() => router.push('/menu')}
              >
                <UtensilsCrossed className="w-6 h-6" />
                <span className="text-xs">{t('menuManagement')}</span>
              </SmoothButton>
              <SmoothButton 
                variant="outline" 
                className="h-20 flex-col gap-2 hover:scale-105 transition-all duration-200"
                onClick={() => router.push('/admin/economy/reports')}
              >
                <TrendingUp className="w-6 h-6" />
                <span className="text-xs">{t('reports')}</span>
              </SmoothButton>
              <SmoothButton 
                variant="outline" 
                className="h-20 flex-col gap-2 hover:scale-105 transition-all duration-200"
                onClick={() => router.push('/admin/system/display')}
              >
                <Monitor className="w-6 h-6" />
                <span className="text-xs">{t('screenLayout')}</span>
              </SmoothButton>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
