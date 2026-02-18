//
//  RecommendationsListView.swift
//  CropCopilot
//

import SwiftUI

struct RecommendationsListView: View {
    @StateObject private var viewModel = RecommendationsViewModel()

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                if !Configuration.isRuntimeApiConfigured {
                    Text("Set API_RUNTIME_BASE_URL to keep iOS synced with AWS runtime.")
                        .font(.caption)
                        .foregroundStyle(.orange)
                        .padding(.horizontal)
                        .padding(.top, 6)
                }

                searchBar
                sortPicker

                if viewModel.isLoading && viewModel.recommendations.isEmpty {
                    loadingView
                } else if viewModel.recommendations.isEmpty {
                    emptyView
                } else {
                    cardsRail
                }

                if let error = viewModel.errorMessage {
                    Text(error)
                        .font(.caption)
                        .foregroundStyle(.red)
                        .padding(.vertical, 8)
                }
            }
            .navigationTitle("Recommendations")
            .navigationDestination(for: String.self) { recommendationId in
                RecommendationDetailView(recommendationId: recommendationId)
            }
            .task {
                await viewModel.loadRecommendations(reset: true)
            }
        }
    }

    private var searchBar: some View {
        HStack {
            Image(systemName: "magnifyingglass")
                .foregroundStyle(.white.opacity(0.72))
            TextField("Search by crop or condition...", text: $viewModel.searchText)
                .textFieldStyle(.plain)
                .foregroundStyle(.white)
                .onSubmit {
                    Task { await viewModel.loadRecommendations(reset: true) }
                }

            if !viewModel.searchText.isEmpty {
                Button {
                    viewModel.searchText = ""
                    Task { await viewModel.loadRecommendations(reset: true) }
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundStyle(.white.opacity(0.72))
                }
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .antigravityGlass(cornerRadius: 14)
        .padding(.horizontal, 16)
        .padding(.top, 8)
    }

    private var sortPicker: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(RecommendationsViewModel.SortOption.allCases, id: \.self) { option in
                    Button {
                        viewModel.selectedSort = option
                        Task { await viewModel.loadRecommendations(reset: true) }
                    } label: {
                        Text(option.displayName)
                            .font(.caption.weight(.semibold))
                            .padding(.horizontal, 12)
                            .padding(.vertical, 8)
                            .background(
                                Capsule()
                                    .fill(
                                        viewModel.selectedSort == option
                                            ? Color.appPrimary
                                            : Color.white.opacity(0.08)
                                    )
                            )
                            .overlay(
                                Capsule()
                                    .strokeBorder(.white.opacity(0.14), lineWidth: 0.7)
                            )
                            .foregroundStyle(
                                viewModel.selectedSort == option
                                    ? Color.black
                                    : Color.white.opacity(0.9)
                            )
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
        }
    }

    private var cardsRail: some View {
        VStack(alignment: .leading, spacing: 12) {
            GeometryReader { proxy in
                let spacing: CGFloat = 10
                let visibleCount: CGFloat = proxy.size.width > 800 ? 4.0 : 3.6
                let cardWidth = max(120, (proxy.size.width - (spacing * (visibleCount - 1)) - 32) / visibleCount)

                ScrollView(.horizontal, showsIndicators: false) {
                    LazyHStack(spacing: spacing) {
                        ForEach(viewModel.recommendations) { recommendation in
                            NavigationLink(value: recommendation.id) {
                                RecommendationCard(recommendation: recommendation)
                                    .frame(width: cardWidth)
                                    .frame(maxHeight: .infinity)
                            }
                            .buttonStyle(.plain)
                        }

                        if viewModel.hasMorePages {
                            loadMoreCard
                                .frame(width: cardWidth)
                        }
                    }
                    .scrollTargetLayout()
                    .padding(.horizontal, 16)
                    .padding(.bottom, 6)
                }
                .scrollTargetBehavior(.viewAligned)
                .refreshable {
                    await viewModel.loadRecommendations(reset: true)
                }
            }
            .frame(height: 242)
        }
    }

    private var loadMoreCard: some View {
        Button {
            Task { await viewModel.loadNextPage() }
        } label: {
            VStack(spacing: 10) {
                if viewModel.isLoadingMore {
                    ProgressView()
                        .tint(.white)
                } else {
                    Image(systemName: "arrow.right.circle.fill")
                        .font(.system(size: 28))
                        .foregroundStyle(Color.appPrimary)
                    Text("Load More")
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(.white)
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .padding(12)
            .antigravityGlass(cornerRadius: 18)
            .antigravityFloat(amplitude: 5, parallaxScale: 3)
        }
        .buttonStyle(.plain)
    }

    private var loadingView: some View {
        VStack(spacing: 16) {
            Spacer()
            ProgressView("Loading recommendations...")
                .tint(.white)
                .foregroundStyle(.white)
            Spacer()
        }
    }

    private var emptyView: some View {
        VStack(spacing: 14) {
            Spacer()
            Image(systemName: "doc.text.magnifyingglass")
                .font(.system(size: 50))
                .foregroundStyle(.white.opacity(0.55))
            Text("No recommendations yet")
                .font(.headline)
                .foregroundStyle(.white)
            Text("Submit a photo or lab report to get started.")
                .font(.subheadline)
                .foregroundStyle(.white.opacity(0.72))
            Spacer()
        }
    }
}
