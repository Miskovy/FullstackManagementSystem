"use client"

import { useState, useEffect } from "react"
import { Profile } from "@/types/database"
import { getAllProfiles, updateUserRole, deleteUser } from "@/app/actions/admin"
import { Shield, ShieldCheck, Trash2, Loader2, Crown, Users, AlertCircle } from "lucide-react"

export default function AdminSettingsTab() {
    const [profiles, setProfiles] = useState<Profile[]>([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [successMsg, setSuccessMsg] = useState<string | null>(null)

    useEffect(() => {
        loadProfiles()
    }, [])

    async function loadProfiles() {
        setLoading(true)
        const result = await getAllProfiles()
        if (result.error) {
            setError(result.error)
        } else {
            setProfiles(result.profiles)
        }
        setLoading(false)
    }

    async function handleRoleChange(userId: string, newRole: 'admin' | 'member') {
        setActionLoading(userId)
        setError(null)
        setSuccessMsg(null)
        const result = await updateUserRole(userId, newRole)
        if (result.error) {
            setError(result.error)
        } else {
            setSuccessMsg("Role updated successfully!")
            await loadProfiles()
        }
        setActionLoading(null)
        setTimeout(() => setSuccessMsg(null), 3000)
    }

    async function handleDelete(userId: string, email: string) {
        if (!confirm(`Are you sure you want to delete "${email}"? This cannot be undone.`)) return
        setActionLoading(userId)
        setError(null)
        const result = await deleteUser(userId)
        if (result.error) {
            setError(result.error)
        } else {
            setSuccessMsg("User removed successfully!")
            await loadProfiles()
        }
        setActionLoading(null)
        setTimeout(() => setSuccessMsg(null), 3000)
    }

    const adminCount = profiles.filter(p => p.role === 'admin').length
    const memberCount = profiles.filter(p => p.role === 'member').length

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
                <div className="flex gap-4 text-sm font-medium">
                    <div className="flex items-center gap-2 text-amber-400">
                        <Crown className="w-4 h-4" /> {adminCount} Admin{adminCount !== 1 ? 's' : ''}
                    </div>
                    <div className="flex items-center gap-2 text-blue-400">
                        <Users className="w-4 h-4" /> {memberCount} Member{memberCount !== 1 ? 's' : ''}
                    </div>
                </div>
            </div>

            {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                </div>
            )}
            {successMsg && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-sm font-medium flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 shrink-0" /> {successMsg}
                </div>
            )}

            <div className="border border-zinc-800 rounded-xl overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-zinc-900 border-b border-zinc-800 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    <div className="col-span-4">User</div>
                    <div className="col-span-3">Role</div>
                    <div className="col-span-3">Joined</div>
                    <div className="col-span-2 text-right">Actions</div>
                </div>

                {/* Table Rows */}
                {profiles.map(p => (
                    <div key={p.id} className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-zinc-800/50 items-center hover:bg-zinc-900/30 transition-colors last:border-b-0">
                        {/* User Info */}
                        <div className="col-span-4 flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                                p.role === 'admin' 
                                ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30' 
                                : 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20 text-blue-400 border border-blue-500/30'
                            }`}>
                                {(p.full_name || p.email || '?')[0].toUpperCase()}
                            </div>
                            <div className="min-w-0">
                                <div className="font-medium text-zinc-100 truncate">{p.full_name || 'No name'}</div>
                                <div className="text-xs text-zinc-500 truncate">{p.email}</div>
                            </div>
                        </div>

                        {/* Role Selector */}
                        <div className="col-span-3">
                            <select
                                value={p.role}
                                onChange={e => handleRoleChange(p.id, e.target.value as 'admin' | 'member')}
                                disabled={actionLoading === p.id}
                                className={`bg-zinc-950 border rounded-lg px-3 py-1.5 text-sm outline-none transition-colors disabled:opacity-50 ${
                                    p.role === 'admin'
                                    ? 'border-amber-500/30 text-amber-400 focus:border-amber-500'
                                    : 'border-zinc-700 text-zinc-300 focus:border-blue-500'
                                }`}
                            >
                                <option value="admin">👑 Admin</option>
                                <option value="member">👤 Member</option>
                            </select>
                        </div>

                        {/* Join Date */}
                        <div className="col-span-3 text-sm text-zinc-500">
                            {new Date(p.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </div>

                        {/* Actions */}
                        <div className="col-span-2 flex justify-end gap-2">
                            {actionLoading === p.id ? (
                                <Loader2 className="w-4 h-4 animate-spin text-zinc-500" />
                            ) : (
                                <button
                                    onClick={() => handleDelete(p.id, p.email)}
                                    className="p-2 rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-500 transition-colors"
                                    title="Delete user"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
