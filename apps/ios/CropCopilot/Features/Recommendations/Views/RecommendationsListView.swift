//
//  RecommendationsListView.swift
//  CropCopilot
//

import SwiftUI

struct RecommendationsListView: View {
    @StateObject private var viewModel = RecommendationsViewModel()

    var body: some View {
        NavigationStack {
            VStack(spacing: Spacing.md) {
                searchBar
                sortPicker

                if viewModel.isLoading && viewModel.recommendations.isEmpty {
                    loadingView
                } else if viewModel.recommendations.isEmpty {
                    emptyView
                } else {
                    recommendationsList
                }

                if let error = viewModel.errorMessage {
                    Text(error)
                        .font(.caption)
                        .foregroundStyle(.red)
                        .padding(.vertical, Spacing.sm)
                }
            }
            .navigationTitle("Recommendations")
            .navigationDestination(for: String.self) { recommendationId in
                RecommendationDetailView(recommendationId: recommendationId)
            }
            .task {
                await viewModel.loadIfNeeded()
            }
            .onAppear {
                Task {
                    await viewModel.refreshRecommendations()
                }
            }
        }
    }

    // MARK: - Search Bar

    private var searchBar: some View {
        HStack {
            Image(systemName: "magnifyingglass")
                .foregroundStyle(.secondary)
            TextField("Search by crop or condition...", text: $viewModel.searchText)
                .textFieldStyle(.plain)
                .foregroundStyle(.primary)
                .onSubmit {
                    Task { await viewModel.loadRecommendations(reset: true) }
                }

            if !viewModel.searchText.isEmpty {
                Button {
                    viewModel.searchText = ""
                    Task { await viewModel.loadRecommendations(reset: true) }
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundStyle(.secondary)
                }
            }
        }
        .padding(.horizontal, Spacing.md)
        .padding(.vertical, Spacing.sm + 2)
        .antigravityGlass(cornerRadius: CornerRadius.md)
        .padding(.horizontal, Spacing.lg)
        .padding(.top, Spacing.sm)
    }

    // MARK: - Sort Picker

    private var sortPicker: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: Spacing.sm) {
                ForEach(RecommendationsViewModel.SortOption.allCases, id: \.self) { option in
                    Button {
                        viewModel.selectedSort = option
                        Task { await viewModel.loadRecommendations(reset: true) }
                    } label: {
                        let isSelected = viewModel.selectedSort == option
                        Text(option.displayName)
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(isSelected ? Color.appPrimary : .primary)
                            .padding(.horizontal, Spacing.md)
                            .padding(.vertical, Spacing.sm)
                            .background(
                                Capsule()
                                    .fill(isSelected ? Color.appPrimary.opacity(0.14) : Color.appSecondaryBackground)
                            )
                            .overlay(
                                Capsule()
                                    .stroke(
                                        isSelected ? Color.appPrimary : Color.black.opacity(0.08),
                                        lineWidth: isSelected ? 1.1 : 0.8
                                    )
                            )
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, Spacing.lg)
            .padding(.vertical, Spacing.md)
        }
    }

    // MARK: - Recommendations List

    private var recommendationsList: some View {
        ScrollView {
            LazyVStack(spacing: Spacing.sm) {
                if !viewModel.recommendations.isEmpty {
                    HStack {
                        Text("\(viewModel.recommendations.count) recommendation\(viewModel.recommendations.count == 1 ? "" : "s")")
                            .font(.appCaption.weight(.semibold))
                            .foregroundStyle(.secondary)
                        Spacer()
                    }
                    .padding(.bottom, 2)
                }

                ForEach(Array(viewModel.recommendations.enumerated()), id: \.element.id) { index, recommendation in
                    NavigationLink(value: recommendation.id) {
                        RecommendationCard(recommendation: recommendation, style: .row)
                    }
                    .buttonStyle(.plain)
                    .onAppear {
                        let preloadThreshold = max(viewModel.recommendations.count - 3, 0)
                        if index >= preloadThreshold {
                            Task { await viewModel.loadNextPage() }
                        }
                    }
                }

                if viewModel.hasMorePages {
                    loadMoreButton
                }
            }
            .padding(.horizontal, Spacing.lg)
            .padding(.bottom, Spacing.xxl)
        }
        .refreshable {
            await viewModel.refreshRecommendations()
        }
    }

    // MARK: - Load More

    private var loadMoreButton: some View {
        Button {
            Task { await viewModel.loadNextPage() }
        } label: {
            HStack(spacing: Spacing.sm) {
                if viewModel.isLoadingMore {
                    ProgressView().tint(Color.appPrimary)
                } else {
                    Image(systemName: "arrow.right.circle.fill")
                        .font(.system(size: 22))
                        .foregroundStyle(Color.appPrimary)
                    Text("Load More")
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(.primary)
                }
            }
            .frame(maxWidth: .infinity, alignment: .center)
            .padding(.vertical, Spacing.md)
            .antigravityGlass(cornerRadius: CornerRadius.md)
        }
        .buttonStyle(.plain)
    }

    // MARK: - States

    private var loadingView: some View {
        VStack(spacing: Spacing.lg) {
            Spacer()
            ProgressView("Loading recommendations...")
                .tint(Color.appPrimary)
                .foregroundStyle(.primary)
            Spacer()
        }
    }

    private var emptyView: some View {
        VStack(spacing: Spacing.md) {
            Spacer()
            IconBadge(
                icon: "doc.text.magnifyingglass",
                color: .appSecondary,
                size: 52,
                cornerRadius: 16
            )
            Text("No recommendations yet")
                .font(.headline)
                .foregroundStyle(.primary)
            Text("Submit a photo or lab report to get started.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
            Spacer()
        }
    }
}
