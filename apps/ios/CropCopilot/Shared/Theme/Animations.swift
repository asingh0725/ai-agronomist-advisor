//
//  Animations.swift
//  CropCopilot
//
//  Phase 2 animation modifiers — float, pulse-glow, and shimmer loading.
//  All animations respect prefers-reduced-motion via accessibilityReduceMotion.
//

import SwiftUI

// MARK: - Float Animation

/// Gentle up/down sine-wave float — matches the web `@keyframes float` effect.
/// Use on hero icons, metric values, and featured cards.
struct FloatAnimationModifier: ViewModifier {
    let amplitude: CGFloat
    let duration: Double
    @State private var floatUp = false
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    func body(content: Content) -> some View {
        content
            .offset(y: (floatUp ? -amplitude : amplitude))
            .onAppear {
                guard !reduceMotion else { return }
                withAnimation(
                    .easeInOut(duration: duration)
                    .repeatForever(autoreverses: true)
                ) {
                    floatUp = true
                }
            }
    }
}

// MARK: - Pulse Glow Animation

/// Breathing shadow glow — matches the web `@keyframes pulse-glow` effect.
/// Use on confidence arcs, key metric values, and CTA elements.
struct PulseGlowModifier: ViewModifier {
    let color: Color
    let radius: CGFloat
    let duration: Double
    @State private var isGlowing = false
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    func body(content: Content) -> some View {
        content
            .shadow(
                color: color.opacity(isGlowing ? 0.48 : 0.16),
                radius: isGlowing ? radius : radius * 0.4,
                x: 0,
                y: 0
            )
            .onAppear {
                guard !reduceMotion else { return }
                withAnimation(
                    .easeInOut(duration: duration)
                    .repeatForever(autoreverses: true)
                ) {
                    isGlowing = true
                }
            }
    }
}

// MARK: - Shimmer Loading Modifier

/// Horizontal shimmer sweep for skeleton loading states.
/// Apply over a gray `RoundedRectangle` placeholder.
struct ShimmerModifier: ViewModifier {
    @State private var phase: CGFloat = -1.5
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    func body(content: Content) -> some View {
        content
            .overlay {
                if !reduceMotion {
                    GeometryReader { geometry in
                        LinearGradient(
                            stops: [
                                .init(color: .clear, location: 0.0),
                                .init(color: .white.opacity(0.55), location: 0.45),
                                .init(color: .white.opacity(0.55), location: 0.55),
                                .init(color: .clear, location: 1.0),
                            ],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                        .frame(width: geometry.size.width * 2)
                        .offset(x: geometry.size.width * phase)
                    }
                    .clipped()
                    .onAppear {
                        withAnimation(.linear(duration: 1.4).repeatForever(autoreverses: false)) {
                            phase = 1.5
                        }
                    }
                }
            }
    }
}

// MARK: - Skeleton Shapes

/// Single skeleton line placeholder — use to mimic loading text rows.
struct SkeletonLine: View {
    var width: CGFloat? = nil
    var height: CGFloat = 13
    var cornerRadius: CGFloat = 6

    var body: some View {
        RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
            .fill(Color.appSecondaryBackground)
            .frame(width: width, maxWidth: width == nil ? .infinity : nil, minWidth: 0)
            .frame(height: height)
            .shimmer()
    }
}

/// Card-shaped skeleton placeholder — use to mimic a loading card.
struct SkeletonCard: View {
    var height: CGFloat = 90
    var cornerRadius: CGFloat = 16

    var body: some View {
        RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
            .fill(Color.appSecondaryBackground)
            .frame(maxWidth: .infinity)
            .frame(height: height)
            .shimmer()
    }
}

// MARK: - View Extensions

extension View {
    /// Gentle floating up/down animation — like `@keyframes float`.
    func floatAnimation(amplitude: CGFloat = 5, duration: Double = 5.5) -> some View {
        modifier(FloatAnimationModifier(amplitude: amplitude, duration: duration))
    }

    /// Breathing glow shadow — like `@keyframes pulse-glow`.
    func pulseGlow(color: Color = .appPrimary, radius: CGFloat = 14, duration: Double = 3.0) -> some View {
        modifier(PulseGlowModifier(color: color, radius: radius, duration: duration))
    }

    /// Horizontal shimmer sweep for loading states.
    func shimmer() -> some View {
        modifier(ShimmerModifier())
    }
}
