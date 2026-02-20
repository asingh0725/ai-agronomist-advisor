//
//  RecommendationsListView.swift
//  CropCopilot
//

import SwiftUI

struct RecommendationsListView: View {
    @StateObject private var viewModel = RecommendationsViewModel()
    @State private var showGrid = true

    private let gridColumns = [
        GridItem(.flexible(), spacing: Spacing.sm),
        GridItem(.flexible(), spacing: Spacing.sm),
    ]

    var body: some View {
        NavigationStack {
            VStack(spacing: Spacing.md) {
                searchBar
                controlBar

                if viewModel.isLoading && viewModel.recommendations.isEmpty {
                    loadingView
                } else if viewModel.recommendations.isEmpty {
                    emptyView
                } else {
                    if showGrid {
                        gridContent
                    } else {
                        listContent
                    }
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

    // MARK: - Control Bar (sort + layout toggle)

    private var controlBar: some View {
        HStack(spacing: Spacing.sm) {
            // Sort chips
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
                .padding(.vertical, Spacing.md)
            }

            // Layout toggle
            Button {
                withAnimation(.appFast) {
                    showGrid.toggle()
                }
            } label: {
                Image(systemName: showGrid ? "rectangle.grid.1x2.fill" : "square.grid.2x2.fill")
                    .font(.subheadline)
                    .foregroundStyle(Color.appSecondary)
                    .frame(width: 34, height: 34)
                    .background(Color.appSecondaryBackground)
                    .clipShape(RoundedRectangle(cornerRadius: CornerRadius.sm, style: .continuous))
            }
            .buttonStyle(.plain)
        }
        .padding(.horizontal, Spacing.lg)
    }

    // MARK: - Grid Content

    private var gridContent: some View {
        ScrollView {
            LazyVGrid(columns: gridColumns, spacing: Spacing.sm) {
                ForEach(Array(viewModel.recommendations.enumerated()), id: \.element.id) { index, recommendation in
                    NavigationLink(value: recommendation.id) {
                        RecommendationCard(recommendation: recommendation, style: .grid)
                    }
                    .buttonStyle(.plain)
                    .onAppear {
                        let preloadThreshold = max(viewModel.recommendations.count - 4, 0)
                        if index >= preloadThreshold {
                            Task { await viewModel.loadNextPage() }
                        }
                    }
                }
            }
            .padding(.horizontal, Spacing.lg)
            .padding(.bottom, Spacing.xxl)

            if viewModel.hasMorePages {
                loadMoreButton
                    .padding(.horizontal, Spacing.lg)
                    .padding(.bottom, Spacing.lg)
            }
        }
        .refreshable {
            await viewModel.refreshRecommendations()
        }
    }

    // MARK: - List Content

    private var listContent: some View {
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

    // MARK: - Loading Skeleton

    private var loadingView: some View {
        ScrollView {
            LazyVGrid(columns: gridColumns, spacing: Spacing.sm) {
                ForEach(0..<6, id: \.self) { _ in
                    SkeletonCard(height: 190, cornerRadius: CornerRadius.lg)
                }
            }
            .padding(.horizontal, Spacing.lg)
        }
    }

    // MARK: - Empty State

    private var emptyView: some View {
        VStack(spacing: Spacing.md) {
            Spacer()
            IconBadge(
                icon: "doc.text.magnifyingglass",
                color: .appSecondary,
                size: 52,
                cornerRadius: 16
            )
            .floatAnimation(amplitude: 4, duration: 5)
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
