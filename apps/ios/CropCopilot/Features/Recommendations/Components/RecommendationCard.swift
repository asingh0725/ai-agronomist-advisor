//
//  RecommendationCard.swift
//  CropCopilot
//

import SwiftUI

struct RecommendationCard: View {
    let recommendation: RecommendationSummary

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
                    .foregroundStyle(.white)
                    .lineLimit(2)

                Text(timestampLabel)
                    .font(.caption2)
                    .foregroundStyle(.white.opacity(0.65))
                    .lineLimit(1)
            }
        }
        .padding(12)
        .antigravityGlass(cornerRadius: 18)
        .antigravityFloat(amplitude: 6, parallaxScale: 4)
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
                    .tint(.white.opacity(0.9))
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(Color.white.opacity(0.05))
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
            Color.white.opacity(0.05)
            Image(systemName: "photo")
                .font(.title3)
                .foregroundStyle(.white.opacity(0.6))
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
