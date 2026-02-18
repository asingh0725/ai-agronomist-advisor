//
//  RecommendationCard.swift
//  CropCopilot
//

import SwiftUI

struct RecommendationCard: View {
    enum LayoutStyle {
        case compact
        case row
    }

    let recommendation: RecommendationSummary
    var style: LayoutStyle = .row

    private var inputImageURL: URL? {
        Configuration.resolveMediaURL(recommendation.input.imageUrl)
    }

    private var timestampLabel: String {
        guard let parsed = DateParsing.iso8601(recommendation.createdAt) else {
            return recommendation.createdAt
        }

        return parsed.formatted(date: .abbreviated, time: .shortened)
    }

    var body: some View {
        Group {
            switch style {
            case .compact:
                compactBody
            case .row:
                rowBody
            }
        }
    }

    private var rowBody: some View {
        HStack(spacing: 12) {
            RecommendationThumbnail(url: inputImageURL)
                .frame(width: 68, height: 68)

            VStack(alignment: .leading, spacing: 6) {
                Text(AppConstants.cropLabel(for: recommendation.input.crop ?? "Unknown"))
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(Color.appPrimary)
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

            Spacer(minLength: 8)

            CanvasConfidenceArc(confidence: recommendation.confidence)
                .frame(width: 62, height: 44)
        }
        .padding(14)
        .antigravityGlass(cornerRadius: 16)
    }

    private var compactBody: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .top, spacing: 8) {
                RecommendationThumbnail(url: inputImageURL)
                    .frame(width: 56, height: 56)

                Spacer(minLength: 6)

                CanvasConfidenceArc(confidence: recommendation.confidence)
                    .frame(width: 56, height: 38)
            }

            VStack(alignment: .leading, spacing: 6) {
                Text(AppConstants.cropLabel(for: recommendation.input.crop ?? "Unknown"))
                    .font(.custom("Times New Roman", size: 11).weight(.semibold))
                    .foregroundStyle(Color.appPrimary)
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
        .padding(12)
        .antigravityGlass(cornerRadius: 18)
    }
}

private struct RecommendationThumbnail: View {
    let url: URL?

    var body: some View {
        AsyncImage(url: url) { phase in
            switch phase {
            case .success(let image):
                image
                    .resizable()
                    .scaledToFill()
            case .empty:
                ProgressView()
                    .tint(Color.appPrimary)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(Color.appSecondaryBackground)
            default:
                fallback
            }
        }
        .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 10, style: .continuous)
                .stroke(.white.opacity(0.18), lineWidth: 0.7)
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
