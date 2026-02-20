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
            .frame(minWidth: 0, maxWidth: width ?? .infinity)
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

// MARK: - Animated Particle Field

/// Floating organic particle field — subtle pollen/seed drift for hero backgrounds.
/// Draws 18 small white circles that drift upward with staggered phase offsets.
/// Uses `TimelineView(.animation)` + `Canvas` for GPU-accelerated drawing.
/// Entirely transparent when `accessibilityReduceMotion` is enabled.
struct AnimatedParticleField: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        if reduceMotion {
            Color.clear
        } else {
            TimelineView(.animation(minimumInterval: 1.0 / 30.0)) { timeline in
                Canvas { context, size in
                    guard size.width > 0, size.height > 0 else { return }
                    let t = timeline.date.timeIntervalSinceReferenceDate
                    let count = 22

                    for i in 0..<count {
                        let fi = Double(i)
                        // Distribute X positions using golden-angle spacing
                        let baseX = (fi * 137.508).truncatingRemainder(dividingBy: size.width * 0.86) + size.width * 0.07
                        let swayX = sin(t * 0.38 + fi * 0.85) * 14
                        let x = baseX + swayX

                        // Drift upward; wrap when past top
                        let speed = 15 + fi.truncatingRemainder(dividingBy: 6) * 5
                        let phase = fi * (size.height / Double(count))
                        let rawY = size.height - (t * speed + phase).truncatingRemainder(dividingBy: size.height + 24)
                        let y = rawY < -8 ? rawY + size.height + 24 : rawY

                        let radius = 1.2 + (fi.truncatingRemainder(dividingBy: 3)) * 0.9
                        let opacity = 0.07 + 0.06 * sin(t * 0.55 + fi * 1.2)

                        let dot = CGRect(x: x - radius, y: y - radius, width: radius * 2, height: radius * 2)
                        context.opacity = opacity
                        context.fill(Path(ellipseIn: dot), with: .color(.white))
                    }
                }
            }
            .allowsHitTesting(false)
        }
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
