//
//  AntigravityStyles.swift
//  CropCopilot
//

import SwiftUI

// MARK: - Glass Modifier

struct AntigravityGlassModifier: ViewModifier {
    let cornerRadius: CGFloat

    func body(content: Content) -> some View {
        content
            .background(
                LinearGradient(
                    colors: [
                        Color.appCardBackground,
                        Color.appCardBackground.opacity(0.98),
                    ],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            )
            .clipShape(RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                    .strokeBorder(.black.opacity(0.06), lineWidth: 0.8)
            )
            .shadow(color: .black.opacity(0.06), radius: 14, x: 0, y: 7)
    }
}

// MARK: - Hero Card Modifier

/// Dark earth-gradient card — matches the web hero sections exactly.
/// Lime hairline accent at top, subtle primary glow shadow.
struct HeroCardModifier: ViewModifier {
    func body(content: Content) -> some View {
        content
            .background(
                LinearGradient(
                    stops: [
                        .init(color: Color.appEarth950, location: 0.00),
                        .init(color: Color.appEarth900, location: 0.50),
                        .init(color: Color.appEarth950, location: 1.00),
                    ],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            )
            .clipShape(RoundedRectangle(cornerRadius: CornerRadius.xl, style: .continuous))
            // Lime hairline at top — matches web `border-top: gradient lime`
            .overlay(alignment: .top) {
                LinearGradient(
                    colors: [.clear, Color.appPrimary.opacity(0.55), .clear],
                    startPoint: .leading,
                    endPoint: .trailing
                )
                .frame(height: 1.5)
                .padding(.horizontal, CornerRadius.xl)
            }
            .overlay(
                RoundedRectangle(cornerRadius: CornerRadius.xl, style: .continuous)
                    .stroke(Color.appPrimary.opacity(0.10), lineWidth: 1)
            )
            .shadow(color: Color.appPrimary.opacity(0.14), radius: 24, x: 0, y: 8)
            .shadow(color: .black.opacity(0.22), radius: 14, x: 0, y: 6)
    }
}

// MARK: - Accent-bordered Card Modifier

/// White card with a lime accent border — for interactive/highlighted cards.
struct AccentBorderedCardModifier: ViewModifier {
    let cornerRadius: CGFloat

    func body(content: Content) -> some View {
        content
            .background(Color.appCardBackground)
            .clipShape(RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                    .stroke(Color.appPrimary.opacity(0.45), lineWidth: 1.2)
            )
            .shadow(color: Color.appPrimary.opacity(0.12), radius: 10, x: 0, y: 4)
    }
}

// MARK: - Float Modifier (stub — Phase 2 animates this)

struct AntigravityFloatModifier: ViewModifier {
    let amplitude: CGFloat
    let parallaxScale: CGFloat

    func body(content: Content) -> some View {
        content
    }
}

// MARK: - Button Styles

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
                                        .clear,
                                    ],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                    )
                    .shadow(
                        color: Color.appPrimary.opacity(configuration.isPressed ? 0.18 : 0.38),
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

// MARK: - Product Type Badge

/// Semantic color-coded capsule badge for product types.
/// Matches the web pill badge pattern with per-type color coding.
struct ProductTypeBadge: View {
    let type: String

    private var prettyType: String {
        type.replacingOccurrences(of: "_", with: " ").capitalized
    }

    private var color: Color { .forProductType(type) }

    var body: some View {
        Text(prettyType)
            .font(.caption.weight(.semibold))
            .foregroundStyle(color)
            .padding(.horizontal, 9)
            .padding(.vertical, 5)
            .background(color.opacity(0.12))
            .clipShape(Capsule())
            .overlay(
                Capsule()
                    .stroke(color.opacity(0.28), lineWidth: 0.8)
            )
    }
}

// MARK: - Section Header

/// Section title with a lime accent underline — matches the web design language.
struct SectionHeader<Trailing: View>: View {
    let title: String
    @ViewBuilder let trailing: () -> Trailing

    var body: some View {
        HStack(alignment: .bottom) {
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.headline)
                    .foregroundStyle(.primary)
                Rectangle()
                    .fill(
                        LinearGradient(
                            colors: [Color.appPrimary, Color.appPrimary.opacity(0)],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .frame(width: 28, height: 2)
                    .clipShape(Capsule())
            }
            Spacer()
            trailing()
        }
    }
}

extension SectionHeader where Trailing == EmptyView {
    init(title: String) {
        self.title = title
        self.trailing = { EmptyView() }
    }
}

// MARK: - Icon Badge

/// Colored rounded-square icon badge used in action cards and list rows.
struct IconBadge: View {
    let icon: String
    let color: Color
    var size: CGFloat = 32
    var cornerRadius: CGFloat = 9

    var body: some View {
        Image(systemName: icon)
            .font(.system(size: size * 0.44, weight: .semibold))
            .foregroundStyle(.white)
            .frame(width: size, height: size)
            .background(color)
            .clipShape(RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
            .shadow(color: color.opacity(0.36), radius: 6, x: 0, y: 3)
    }
}

// MARK: - View Extensions

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

    func heroGradientCard() -> some View {
        modifier(HeroCardModifier())
    }

    func accentBorderedCard(cornerRadius: CGFloat = 16) -> some View {
        modifier(AccentBorderedCardModifier(cornerRadius: cornerRadius))
    }
}
