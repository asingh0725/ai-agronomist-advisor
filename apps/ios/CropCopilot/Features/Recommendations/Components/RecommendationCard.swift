//
//  RecommendationCard.swift
//  CropCopilot
//

import SwiftUI

struct RecommendationCard: View {
    enum LayoutStyle {
        case compact
        case row
        case grid
    }

    let recommendation: RecommendationSummary
    var style: LayoutStyle = .row

    private var timestampLabel: String {
        guard let parsed = DateParsing.iso8601(recommendation.createdAt) else {
            return recommendation.createdAt
        }
        return parsed.formatted(date: .abbreviated, time: .shortened)
    }

    private var level: ConfidenceLevel {
        ConfidenceLevel.from(recommendation.confidence)
    }

    var body: some View {
        Group {
            switch style {
            case .compact:
                compactBody
            case .row:
                rowBody
            case .grid:
                gridBody
            }
        }
    }

    // MARK: - Row Style (Phase 1 design, polished)

    private var rowBody: some View {
        HStack(spacing: Spacing.md) {
            RecommendationThumbnail(source: recommendation.input.imageUrl, size: 68)

            VStack(alignment: .leading, spacing: 6) {
                Text(AppConstants.cropLabel(for: recommendation.input.crop ?? "Unknown"))
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
                    .textCase(.uppercase)

                Text(recommendation.condition)
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(.primary)
                    .lineLimit(2)

                Text(timestampLabel)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
            }

            Spacer(minLength: Spacing.sm)

            VStack(alignment: .trailing, spacing: Spacing.sm) {
                CanvasConfidenceArc(confidence: recommendation.confidence, style: .compact)
                Image(systemName: "chevron.right")
                    .font(.caption.weight(.bold))
                    .foregroundStyle(.secondary)
                    .frame(width: 22, height: 22)
                    .background(Color.appSecondaryBackground)
                    .clipShape(Circle())
            }
        }
        .padding(Spacing.md)
        .antigravityGlass(cornerRadius: CornerRadius.lg)
        .contentShape(RoundedRectangle(cornerRadius: CornerRadius.lg, style: .continuous))
    }

    // MARK: - Compact Style

    private var compactBody: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            HStack(alignment: .top, spacing: Spacing.sm) {
                RecommendationThumbnail(source: recommendation.input.imageUrl, size: 56)
                Spacer(minLength: 6)
                CanvasConfidenceArc(confidence: recommendation.confidence, style: .compact)
            }

            VStack(alignment: .leading, spacing: 6) {
                Text(AppConstants.cropLabel(for: recommendation.input.crop ?? "Unknown"))
                    .font(.custom("Times New Roman", size: 11).weight(.semibold))
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
                    .textCase(.uppercase)

                Text(recommendation.condition)
                    .font(.custom("Inter", size: 12).weight(.semibold))
                    .foregroundStyle(.primary)
                    .lineLimit(2)

                Text(timestampLabel)
                    .font(.caption2)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
            }
        }
        .padding(Spacing.md)
        .antigravityGlass(cornerRadius: CornerRadius.xl)
    }

    // MARK: - Grid Style (Phase 2 — image-first, full-bleed with gradient overlay)

    private var gridBody: some View {
        ZStack(alignment: .bottomLeading) {
            // Background: photo or gradient
            Group {
                if let imageUrl = recommendation.input.imageUrl, !imageUrl.isEmpty {
                    SecureAsyncImage(source: imageUrl) { image in
                        image
                            .resizable()
                            .scaledToFill()
                    } placeholder: {
                        gradientBackground
                    } failure: {
                        gradientBackground
                    }
                } else {
                    gradientBackground
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .clipped()

            // Gradient overlay — darkens from mid to bottom for legibility
            LinearGradient(
                stops: [
                    .init(color: .clear, location: 0.0),
                    .init(color: .black.opacity(0.35), location: 0.45),
                    .init(color: .black.opacity(0.80), location: 1.0),
                ],
                startPoint: .top,
                endPoint: .bottom
            )

            // Content over gradient
            VStack(alignment: .leading, spacing: 6) {
                // Confidence ring badge (top-right)
                HStack {
                    Spacer()
                    CanvasConfidenceArc(confidence: recommendation.confidence, style: .compact)
                        .pulseGlow(color: level.foreground, radius: 10, duration: 3.0)
                }

                Spacer()

                // Crop label
                Text(AppConstants.cropLabel(for: recommendation.input.crop ?? "Unknown"))
                    .font(.system(size: 10, weight: .semibold))
                    .foregroundStyle(.white.opacity(0.72))
                    .textCase(.uppercase)
                    .lineLimit(1)

                // Condition name
                Text(recommendation.condition)
                    .font(.system(size: 13, weight: .bold))
                    .foregroundStyle(.white)
                    .lineLimit(2)
                    .lineSpacing(2)

                // Timestamp
                Text(timestampLabel)
                    .font(.caption2)
                    .foregroundStyle(.white.opacity(0.60))
                    .lineLimit(1)
            }
            .padding(Spacing.md)
        }
        .aspectRatio(0.88, contentMode: .fit)
        .clipShape(RoundedRectangle(cornerRadius: CornerRadius.lg, style: .continuous))
        .overlay(alignment: .top) {
            // Lime hairline at top — matches web card pattern
            LinearGradient(
                colors: [.clear, level.foreground.opacity(0.55), .clear],
                startPoint: .leading,
                endPoint: .trailing
            )
            .frame(height: 1.5)
            .padding(.horizontal, CornerRadius.lg)
        }
        .overlay(
            RoundedRectangle(cornerRadius: CornerRadius.lg, style: .continuous)
                .stroke(.white.opacity(0.10), lineWidth: 0.8)
        )
        .shadow(color: .black.opacity(0.18), radius: 12, x: 0, y: 6)
        .shadow(color: level.foreground.opacity(0.10), radius: 8, x: 0, y: 3)
        .contentShape(RoundedRectangle(cornerRadius: CornerRadius.lg, style: .continuous))
    }

    private var gradientBackground: some View {
        LinearGradient(
            stops: [
                .init(color: Color.appEarth800, location: 0),
                .init(color: Color.appEarth950, location: 1),
            ],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }
}

// MARK: - Thumbnail

private struct RecommendationThumbnail: View {
    let source: String?
    let size: CGFloat

    var body: some View {
        ZStack {
            SecureAsyncImage(source: source) { image in
                image
                    .resizable()
                    .scaledToFill()
            } placeholder: {
                ProgressView()
                    .tint(Color.appPrimary)
            } failure: {
                fallback
            }
        }
        .frame(width: size, height: size)
        .background(Color.appBackground)
        .clipped()
        .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 10, style: .continuous)
                .stroke(.black.opacity(0.10), lineWidth: 0.8)
        )
    }

    private var fallback: some View {
        ZStack {
            Color.appSecondaryBackground
            Image(systemName: "photo")
                .font(.title3)
                .foregroundStyle(.secondary)
        }
    }
}

// MARK: - Date Parsing

private enum DateParsing {
    static func iso8601(_ value: String) -> Date? {
        let withFractional = ISO8601DateFormatter()
        withFractional.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let parsed = withFractional.date(from: value) {
            return parsed
        }

        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime]
        return formatter.date(from: value)
    }
}
