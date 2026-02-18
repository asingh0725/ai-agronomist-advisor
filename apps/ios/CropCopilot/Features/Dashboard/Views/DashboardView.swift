//
//  DashboardView.swift
//  CropCopilot
//

import SwiftUI

struct DashboardView: View {
    @StateObject private var viewModel = DashboardViewModel()
    @Binding var selectedTab: AppTab

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    welcomeBanner
                    quickActions
                    recentRecommendationsSection
                }
                .padding(16)
            }
            .scrollContentBackground(.hidden)
            .background(Color.clear)
            .navigationTitle("Dashboard")
            .refreshable {
                await viewModel.loadRecentRecommendations()
            }
            .task {
                await viewModel.loadRecentRecommendations()
            }
        }
    }

    private var welcomeBanner: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Welcome back!")
                .font(.title2.bold())
                .foregroundStyle(.white)
            Text("Ready to analyze your crops?")
                .font(.subheadline)
                .foregroundStyle(.white.opacity(0.82))
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(18)
        .antigravityGlass(cornerRadius: 20)
        .antigravityFloat(amplitude: 7, parallaxScale: 4)
    }

    private var quickActions: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Quick Actions")
                .font(.headline)
                .foregroundStyle(.white.opacity(0.9))

            HStack(spacing: 12) {
                Button {
                    selectedTab = .diagnose
                } label: {
                    quickActionCard(icon: "camera.fill", title: "Photo", color: .appPrimary)
                }
                .buttonStyle(AntigravityScaleButtonStyle())

                Button {
                    selectedTab = .diagnose
                } label: {
                    quickActionCard(icon: "doc.text.fill", title: "Lab Report", color: .blue)
                }
                .buttonStyle(AntigravityScaleButtonStyle())
            }
        }
    }

    private func quickActionCard(icon: String, title: String, color: Color) -> some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundStyle(color)
            Text(title)
                .font(.caption.weight(.semibold))
                .foregroundStyle(.white)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 20)
        .antigravityGlass(cornerRadius: 16)
        .antigravityFloat(amplitude: 6, parallaxScale: 4)
    }

    private var recentRecommendationsSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Recent Recommendations")
                    .font(.headline)
                    .foregroundStyle(.white.opacity(0.9))
                Spacer()
                Button("See All") {
                    selectedTab = .recommendations
                }
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(Color.appPrimary)
            }

            if viewModel.isLoading {
                ProgressView().tint(.white)
            } else if viewModel.recentRecommendations.isEmpty {
                emptyState
            } else {
                ScrollView(.horizontal, showsIndicators: false) {
                    LazyHStack(spacing: 10) {
                        ForEach(viewModel.recentRecommendations) { recommendation in
                            NavigationLink {
                                RecommendationDetailView(recommendationId: recommendation.id)
                            } label: {
                                RecommendationCard(recommendation: recommendation)
                                    .frame(width: 168)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(.horizontal, 2)
                }
            }

            if let error = viewModel.errorMessage {
                Text(error)
                    .font(.caption)
                    .foregroundStyle(.red)
            }
        }
    }

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "leaf")
                .font(.largeTitle)
                .foregroundStyle(.white.opacity(0.3))
            Text("No recommendations yet")
                .font(.subheadline)
                .foregroundStyle(.white.opacity(0.7))
            Text("Start a diagnosis to get your first recommendation.")
                .font(.caption)
                .foregroundStyle(.white.opacity(0.52))
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 32)
        .antigravityGlass(cornerRadius: 16)
    }
}
