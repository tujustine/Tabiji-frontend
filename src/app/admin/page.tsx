"use client";

import { useEffect, useState } from "react";
import { useAdmin } from "@/hooks/useAdmin";
import { AdminStats, AdminUserStats, AdminTripStats } from "@/types";
import TravelLoader from "@/components/ui/TravelLoader";

export default function AdminDashboard() {
  const { getStats, getUserStats, getTripStats, loading, error } = useAdmin();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [userStats, setUserStats] = useState<AdminUserStats | null>(null);
  const [tripStats, setTripStats] = useState<AdminTripStats | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [statsData, userData, tripData] = await Promise.all([
          getStats(),
          getUserStats(),
          getTripStats(),
        ]);
        setStats(statsData);
        setUserStats(userData);
        setTripStats(tripData);
      } catch (err) {
        console.error("Erreur chargement stats:", err);
      }
    };
    fetchStats();
  }, [getStats, getUserStats, getTripStats]);

  if (loading && !stats && !userStats && !tripStats) {
    return <TravelLoader label="Chargement des statistiques..." />;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Erreur: {error}</p>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const statCards = [
    {
      title: "Utilisateurs",
      value: stats.totalUsers,
      subtitle: `${stats.newUsersLast30Days} nouveaux (30j)`,
      color: "bg-blue-500",
    },
    {
      title: "Voyages",
      value: stats.totalTrips,
      subtitle: `${stats.newTripsLast30Days} nouveaux (30j)`,
      color: "bg-green-500",
    },
    {
      title: "Souvenirs",
      value: stats.totalMemories,
      subtitle: "Total créés",
      color: "bg-purple-500",
    },
    {
      title: "Collaborations",
      value: stats.totalCollaborations,
      subtitle: "Partages de voyages",
      color: "bg-indigo-500",
    },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard Admin</h1>

      {/* Stats principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {statCards.map((card, index) => (
          <div
            key={card.title + index}
            className="bg-white rounded-lg shadow-md p-6 border-l-4"
            style={{ borderLeftColor: card.color.replace("bg-", "") }}
          >
            <h3 className="text-gray-600 text-sm font-medium mb-2">
              {card.title}
            </h3>
            <p className="text-3xl font-bold text-gray-900 mb-1">
              {card.value.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500">{card.subtitle}</p>
          </div>
        ))}
      </div>

      {/* Stats utilisateurs détaillées */}
      {userStats && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6">Statistiques utilisateurs</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">
                Total utilisateurs
              </div>
              <div className="text-2xl font-bold">{userStats.totalUsers}</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Administrateurs</div>
              <div className="text-2xl font-bold">{userStats.adminUsers}</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Avec voyages</div>
              <div className="text-2xl font-bold">
                {userStats.usersWithTrips}
              </div>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Sans voyages</div>
              <div className="text-2xl font-bold">
                {userStats.usersWithoutTrips}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">
              Nouveaux utilisateurs par mois
            </h3>
            <div className="space-y-2">
              {Object.entries(userStats.monthlyStats)
                .sort()
                .map(([month, count]) => (
                  <div
                    key={month}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm text-gray-600">{month}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-48 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${
                              (count /
                                Math.max(
                                  ...Object.values(userStats.monthlyStats),
                                )) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12 text-right">
                        {count}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Stats voyages détaillées */}
      {tripStats && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6">Statistiques voyages</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Total voyages</div>
              <div className="text-2xl font-bold">{tripStats.totalTrips}</div>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Avec souvenirs</div>
              <div className="text-2xl font-bold">
                {tripStats.tripsWithMemories}
              </div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Avec lieux</div>
              <div className="text-2xl font-bold">
                {tripStats.tripsWithPlaces}
              </div>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Sans contenu</div>
              <div className="text-2xl font-bold">
                {tripStats.tripsWithoutContent}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Nouveaux voyages par mois
              </h3>
              <div className="space-y-2">
                {Object.entries(tripStats.monthlyStats)
                  .sort()
                  .map(([month, count]) => (
                    <div
                      key={month}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm text-gray-600">{month}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{
                              width: `${
                                (count /
                                  Math.max(
                                    ...Object.values(tripStats.monthlyStats),
                                  )) *
                                100
                              }%`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium w-8 text-right">
                          {count}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
