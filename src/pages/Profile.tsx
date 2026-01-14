import { useAuth } from '../context/AuthContext';
import { Card, Button, Avatar } from '../components/ui';
import { 
  MapPin, 
  Mail, 
  Phone, 
  Globe, 
  Calendar, 
  User,
  Star,
  MessageSquare,
  MoreHorizontal,
  Briefcase,
  Award
} from 'lucide-react';

export function Profile() {
  const { user, caregiver } = useAuth();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column - Profile Image & Quick Stats */}
        <div className="col-span-1 space-y-6">
          <Card className="p-8 flex flex-col items-center text-center space-y-6 bg-white shadow-sm border border-[#d2d2d7]/30">
            <div className="relative group">
              <Avatar 
                src={null} 
                fallback={caregiver?.name || 'User'} 
                className="h-40 w-40 text-4xl border-4 border-white shadow-lg"
              />
              <div className="absolute bottom-2 right-2 h-4 w-4 bg-[#34c759] rounded-full border-2 border-white"></div>
            </div>
            
            <div className="w-full space-y-4 pt-4 border-t border-[#d2d2d7]/30">
               <div className="flex items-center gap-3 text-left">
                  <div className="bg-[#f5f5f7] p-2 rounded-lg">
                    <Briefcase className="h-5 w-5 text-[#0071e3]" />
                  </div>
                  <div>
                    <p className="text-[12px] font-medium text-[#86868b] uppercase tracking-wider">Experience</p>
                    <p className="text-[14px] font-medium text-[#1d1d1f]">5+ Years</p>
                  </div>
               </div>
               
               <div className="flex items-center gap-3 text-left">
                  <div className="bg-[#f5f5f7] p-2 rounded-lg">
                    <Award className="h-5 w-5 text-[#0071e3]" />
                  </div>
                  <div>
                    <p className="text-[12px] font-medium text-[#86868b] uppercase tracking-wider">Certifications</p>
                    <p className="text-[14px] font-medium text-[#1d1d1f]">Registered Nurse</p>
                  </div>
               </div>
            </div>
          </Card>
        </div>

        {/* Right Column - Main Info */}
        <div className="col-span-1 lg:col-span-2 space-y-8">
          
          {/* Header Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-[32px] font-semibold text-[#1d1d1f] tracking-tight">{caregiver?.name || 'Caregiver'}</h1>
                <p className="text-[17px] text-[#0071e3] font-medium mt-1">Professional Caregiver</p>
                
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-[24px] font-bold text-[#1d1d1f]">9.8</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="h-4 w-4 text-[#ffcc00] fill-[#ffcc00]" />
                    ))}
                  </div>
                  <span className="text-[14px] text-[#86868b] ml-1">(124 reviews)</span>
                </div>
              </div>
              
              <div className="flex gap-3">
                 <Button className="gap-2 bg-[#0071e3] hover:bg-[#0077ed]">
                    <MessageSquare className="h-4 w-4" />
                    Edit Profile
                 </Button>
                 <Button variant="secondary" className="px-3">
                    <MoreHorizontal className="h-5 w-5" />
                 </Button>
              </div>
            </div>
          </div>

          {/* Navigation Tabs (Visual only for now) */}
          <div className="border-b border-[#d2d2d7]/50">
             <div className="flex gap-8">
                <button className="pb-4 border-b-2 border-[#0071e3] text-[#0071e3] font-medium text-[15px]">About</button>
                <button className="pb-4 border-b-2 border-transparent text-[#86868b] hover:text-[#1d1d1f] font-medium text-[15px] transition-colors">Timeline</button>
                <button className="pb-4 border-b-2 border-transparent text-[#86868b] hover:text-[#1d1d1f] font-medium text-[15px] transition-colors">Reviews</button>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
            <div>
              <h3 className="text-[17px] font-semibold text-[#1d1d1f] mb-6">Contact Information</h3>
              <div className="space-y-6">
                
                <div className="flex gap-4">
                   <div className="shrink-0">
                      <Phone className="h-5 w-5 text-[#0071e3]" />
                   </div>
                   <div>
                      <span className="block text-[15px] font-medium text-[#1d1d1f]">+65 9123 4567</span>
                      <span className="text-[13px] text-[#86868b]">Mobile</span>
                   </div>
                </div>

                <div className="flex gap-4">
                   <div className="shrink-0">
                      <MapPin className="h-5 w-5 text-[#0071e3]" />
                   </div>
                   <div>
                      <span className="block text-[15px] font-medium text-[#1d1d1f]">Singapore</span>
                      <span className="text-[13px] text-[#86868b]">Region</span>
                   </div>
                </div>

                <div className="flex gap-4">
                   <div className="shrink-0">
                      <Mail className="h-5 w-5 text-[#0071e3]" />
                   </div>
                   <div>
                      <span className="block text-[15px] font-medium text-[#1d1d1f]">{user?.email || 'email@example.com'}</span>
                      <span className="text-[13px] text-[#86868b]">Email</span>
                   </div>
                </div>

                <div className="flex gap-4">
                   <div className="shrink-0">
                      <Globe className="h-5 w-5 text-[#0071e3]" />
                   </div>
                   <div>
                      <span className="block text-[15px] font-medium text-[#1d1d1f]">careconnect.sg</span>
                      <span className="text-[13px] text-[#86868b]">Website</span>
                   </div>
                </div>

              </div>
            </div>

            <div>
              <h3 className="text-[17px] font-semibold text-[#1d1d1f] mb-6">Basic Information</h3>
              <div className="space-y-6">
                
                <div className="flex gap-4">
                   <div className="shrink-0">
                      <Calendar className="h-5 w-5 text-[#0071e3]" />
                   </div>
                   <div>
                      <span className="block text-[15px] font-medium text-[#1d1d1f]">June 5, 1992</span>
                      <span className="text-[13px] text-[#86868b]">Birthday</span>
                   </div>
                </div>

                <div className="flex gap-4">
                   <div className="shrink-0">
                      <User className="h-5 w-5 text-[#0071e3]" />
                   </div>
                   <div>
                      <span className="block text-[15px] font-medium text-[#1d1d1f]">Male</span>
                      <span className="text-[13px] text-[#86868b]">Gender</span>
                   </div>
                </div>

              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
