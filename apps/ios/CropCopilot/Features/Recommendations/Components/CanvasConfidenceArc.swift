//
//  CanvasConfidenceArc.swift
//  CropCopilot
//

import SwiftUI

enum ConfidenceLevel: String {
    case low
    case medium
    case high

    static func from(_ confidence: Double) -> ConfidenceLevel {
        if confidence < 0.6 { return .low }
        if confidence < 0.8 { return .medium }
        return .high
    }

    var title: String {
        switch self {
        case .low: return "Low Confidence"
        case .medium: return "Medium Confidence"
        case .high: return "High Confidence"
        }
    }

    var icon: String {
        switch self {
        case .low: return "questionmark.circle.fill"
        case .medium: return "exclamationmark.circle.fill"
        case .high: return "checkmark.circle.fill"
        }
    }

    var foreground: Color {
        switch self {
        case .low:    return Color(red: 0.80, green: 0.46, blue: 0.00)
        case .medium: return Color(red: 0.15, green: 0.42, blue: 0.89)
        case .high:   return Color(red: 0.11, green: 0.47, blue: 0.16)
        }
    }

    var background: Color {
        switch self {
        case .low:    return Color(red: 1.0,  green: 0.96, blue: 0.88)
        case .medium: return Color(red: 0.92, green: 0.96, blue: 1.0)
        case .high:   return Color(red: 0.92, green: 0.98, blue: 0.92)
        }
    }
}

// MARK: - Animated Confidence Arc

struct CanvasConfidenceArc: View {
    enum Style {
        case compact
        case detailed
    }

    let confidence: Double
    var style: Style = .compact

    @State private var animatedConfidence: Double = 0

    private var clampedConfidence: Double {
        min(max(confidence, 0), 1)
    }

    private var level: ConfidenceLevel {
        ConfidenceLevel.from(clampedConfidence)
    }

    private var percentText: String {
        "\(Int((animatedConfidence * 100).rounded()))%"
    }

    var body: some View {
        Group {
            switch style {
            case .compact:
                ConfidenceRing(
                    confidence: animatedConfidence,
                    strokeColor: level.foreground,
                    textColor: level.foreground,
                    size: 48,
                    lineWidth: 4,
                    font: .system(size: 13, weight: .bold)
                )
            case .detailed:
                HStack(spacing: Spacing.sm) {
                    ConfidenceRing(
                        confidence: animatedConfidence,
                        strokeColor: level.foreground,
                        textColor: level.foreground,
                        size: 62,
                        lineWidth: 5.5,
                        font: .system(size: 15, weight: .bold)
                    )

                    VStack(alignment: .leading, spacing: 2) {
                        Text(percentText)
                            .font(.subheadline.weight(.semibold))
                            .monospacedDigit()
                        Text(level.title)
                            .font(.caption.weight(.medium))
                            .lineLimit(1)
                    }
                    .foregroundStyle(.primary)
                }
                .padding(.horizontal, Spacing.sm + 2)
                .padding(.vertical, Spacing.sm)
                .background(level.background.opacity(0.65))
                .clipShape(RoundedRectangle(cornerRadius: CornerRadius.md, style: .continuous))
            }
        }
        .onAppear {
            withAnimation(.spring(response: 1.2, dampingFraction: 0.7).delay(0.15)) {
                animatedConfidence = clampedConfidence
            }
        }
        .onChange(of: confidence) { newValue in
            withAnimation(.spring(response: 0.8, dampingFraction: 0.7)) {
                animatedConfidence = min(max(newValue, 0), 1)
            }
        }
    }
}

// MARK: - Ring Shape

private struct ConfidenceRing: View {
    let confidence: Double
    let strokeColor: Color
    let textColor: Color
    let size: CGFloat
    let lineWidth: CGFloat
    let font: Font

    var body: some View {
        ZStack {
            Circle()
                .stroke(Color.black.opacity(0.10), lineWidth: lineWidth)

            Circle()
                .trim(from: 0, to: min(max(confidence, 0), 1))
                .stroke(
                    strokeColor,
                    style: StrokeStyle(lineWidth: lineWidth, lineCap: .round)
                )
                .rotationEffect(.degrees(-90))

            Text("\(Int((confidence * 100).rounded()))%")
                .font(font)
                .foregroundStyle(textColor)
                .monospacedDigit()
                .contentTransition(.numericText())
        }
        .frame(width: size, height: size)
        .accessibilityLabel("Confidence \(Int((confidence * 100).rounded())) percent")
    }
}
