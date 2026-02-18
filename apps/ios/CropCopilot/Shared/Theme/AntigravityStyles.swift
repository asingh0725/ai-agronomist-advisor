//
//  AntigravityStyles.swift
//  CropCopilot
//

import SwiftUI

struct AntigravityGlassModifier: ViewModifier {
    let cornerRadius: CGFloat

    func body(content: Content) -> some View {
        content
            .background(.ultraThinMaterial)
            .clipShape(RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                    .strokeBorder(.white.opacity(0.2), lineWidth: 0.6)
            )
    }
}

struct AntigravityFloatModifier: ViewModifier {
    @EnvironmentObject private var motionManager: MotionManager
    @State private var duration = Double.random(in: 4...6)
    let amplitude: CGFloat
    let parallaxScale: CGFloat

    func body(content: Content) -> some View {
        content
            .phaseAnimator([false, true]) { view, phase in
                view
                    .offset(y: phase ? amplitude : -amplitude)
                    .rotation3DEffect(
                        .degrees(phase ? 1 : -1),
                        axis: (x: 1, y: 0, z: 0)
                    )
                    .offset(
                        x: CGFloat(motionManager.roll) * parallaxScale,
                        y: CGFloat(motionManager.pitch) * parallaxScale
                    )
            } animation: { _ in
                .easeInOut(duration: duration).repeatForever(autoreverses: true)
            }
    }
}

struct GlowSkeuomorphicButtonStyle: ButtonStyle {
    func makeBody(configuration: Self.Configuration) -> some View {
        configuration.label
            .padding(.horizontal, 18)
            .padding(.vertical, 12)
            .background(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .fill(Color.appPrimary)
                    .overlay(
                        RoundedRectangle(cornerRadius: 14, style: .continuous)
                            .fill(
                                LinearGradient(
                                    colors: [
                                        .white.opacity(configuration.isPressed ? 0.08 : 0.18),
                                        .clear
                                    ],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                    )
                    .shadow(
                        color: Color.appPrimary.opacity(configuration.isPressed ? 0.18 : 0.36),
                        radius: configuration.isPressed ? 8 : 16,
                        x: 0,
                        y: configuration.isPressed ? 3 : 6
                    )
            )
            .overlay(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .stroke(.white.opacity(0.25), lineWidth: 0.7)
            )
            .scaleEffect(configuration.isPressed ? 0.98 : 1.0)
            .animation(
                .spring(response: 0.4, dampingFraction: 0.7, blendDuration: 0),
                value: configuration.isPressed
            )
    }
}

struct AntigravityScaleButtonStyle: ButtonStyle {
    func makeBody(configuration: Self.Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.97 : 1)
            .animation(
                .spring(response: 0.4, dampingFraction: 0.7, blendDuration: 0),
                value: configuration.isPressed
            )
    }
}

extension View {
    func antigravityGlass(cornerRadius: CGFloat = 20) -> some View {
        modifier(AntigravityGlassModifier(cornerRadius: cornerRadius))
    }

    func antigravityFloat(amplitude: CGFloat = 8, parallaxScale: CGFloat = 6) -> some View {
        modifier(
            AntigravityFloatModifier(
                amplitude: amplitude,
                parallaxScale: parallaxScale
            )
        )
    }
}
