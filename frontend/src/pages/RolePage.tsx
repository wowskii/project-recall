import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import * as Icons from 'lucide-react';

interface Project {
  id: number;
  title: string;
  description: string;
  is_active: boolean;
}

interface Role {
  id: number;
  name: string;
  color_hex: string;
  icon_name: string;
}

const RolePage: React.FC = () => {
  const { roleId } = useParams<{ roleId: string }>();
  const [role, setRole] = useState<Role | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoleData = async () => {
      try {
        const [roleRes, projectsRes] = await Promise.all([
          fetch(`http://localhost:8000/roles/${roleId}`),
          fetch(`http://localhost:8000/roles/${roleId}/projects`)
        ]);
        
        const roleData = await roleRes.json();
        const projectsData = await projectsRes.json();
        
        setRole(roleData.role);
        setProjects(projectsData.projects);
      } catch (error) {
        console.error("Failed to sync with command center:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRoleData();
  }, [roleId]);

  if (loading) return <div className="p-10 text-slate-400 animate-pulse text-center">Loading Role Data...</div>;
  if (!role) return <div className="p-10 text-red-500 text-center">Critical Error: Role Data Corrupted.</div>;

  // Resolve the dynamic icon
  const IconComponent = (Icons as any)[role.icon_name.charAt(0).toUpperCase() + role.icon_name.slice(1)] || Icons.Shield;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      {/* Header Banner */}
      <div 
        className="relative overflow-hidden rounded-2xl p-8 mb-10 border-b-4 bg-slate-900 shadow-2xl"
        style={{ borderBottomColor: role.color_hex }}
      >
        <div className="flex items-center gap-6 relative z-10">
          <div 
            className="p-4 rounded-xl bg-slate-800 shadow-inner ring-1 ring-white/10"
            style={{ color: role.color_hex }}
          >
            <IconComponent size={48} strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-4xl font-black uppercase tracking-wider">{role.name}</h1>
            <p className="text-slate-400 font-medium">Class Overview & Active Assignments</p>
          </div>
        </div>
        {/* Subtle background glow */}
        <div 
          className="absolute -right-20 -top-20 w-64 h-64 blur-[120px] opacity-20"
          style={{ backgroundColor: role.color_hex }}
        />
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <Link 
            key={project.id}
            to={`/projects/${project.id}`}
            className="group relative p-6 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-600 transition-all shadow-lg overflow-hidden"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold group-hover:text-white transition-colors">{project.title}</h3>
              <div className={`h-2 w-2 rounded-full ${project.is_active ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-slate-600'}`} />
            </div>
            <p className="text-slate-400 text-sm line-clamp-2 mb-6">
              {project.description || "No mission brief provided."}
            </p>
            <div className="flex items-center text-xs font-bold uppercase tracking-tighter text-slate-500 group-hover:text-slate-300">
              Deploy to Mission <Icons.ArrowRight size={14} className="ml-2 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        ))}

        {/* Add Project Card */}
        <button className="flex flex-col items-center justify-center p-6 bg-slate-900/40 border-2 border-dashed border-slate-800 rounded-xl hover:border-slate-600 hover:bg-slate-900 transition-all text-slate-500 group">
          <Icons.PlusCircle size={32} className="mb-2 group-hover:scale-110 transition-transform" />
          <span className="font-bold text-sm uppercase tracking-widest">Initialize New Project</span>
        </button>
      </div>
    </div>
  );
};

export default RolePage;