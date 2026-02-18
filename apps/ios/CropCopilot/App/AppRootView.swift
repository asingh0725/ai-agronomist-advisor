//
//  AppRootView.swift
//  CropCopilot
//

import SwiftUI
import AVKit

struct AppRootView: View {
    @StateObject private var motionManager = MotionManager()
    @State private var columnVisibility: NavigationSplitViewVisibility = .all
    @State private var selectedTab: AppTab? = .dashboard

    @AppStorage("cropcopilot.preferences.motion.enabled")
    private var motionEnabled = true
    @AppStorage("cropcopilot.preferences.notifications.enabled")
    private var notificationsEnabled = true
    @AppStorage("cropcopilot.preferences.feedback.reminders.enabled")
    private var feedbackRemindersEnabled = true

    private var dashboardTabBinding: Binding<AppTab> {
        Binding(
            get: { selectedTab ?? .dashboard },
            set: { selectedTab = $0 }
        )
    }

    var body: some View {
        ZStack {
            Color("Obsidian").ignoresSafeArea()

            GeometryReader { proxy in
                VideoPlayerView(
                    filename: "Hyper_Realistic_Soybean_Leaf_Animation",
                    ext: "mp4"
                )
                .aspectRatio(contentMode: .fill)
                .frame(width: proxy.size.width, height: proxy.size.height)
                .blur(radius: 20)
                .overlay(
                    LinearGradient(
                        colors: [
                            .black.opacity(0.32),
                            .black.opacity(0.72)
                        ],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                )
                .offset(
                    x: CGFloat(motionManager.roll) * 20,
                    y: CGFloat(motionManager.pitch) * 20
                )
            }
            .ignoresSafeArea()

            NavigationSplitView(columnVisibility: $columnVisibility) {
                SidebarView(
                    selectedTab: $selectedTab,
                    motionEnabled: $motionEnabled,
                    notificationsEnabled: $notificationsEnabled,
                    feedbackRemindersEnabled: $feedbackRemindersEnabled
                )
                .padding(12)
            } detail: {
                Group {
                    switch selectedTab ?? .dashboard {
                    case .dashboard:
                        DashboardView(selectedTab: dashboardTabBinding)
                    case .diagnose:
                        DiagnoseTabView()
                    case .recommendations:
                        RecommendationsListView()
                    case .products:
                        ProductsPlaceholderView()
                    case .profile:
                        ProfileView()
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .background(Color.clear)
                .transition(.opacity.combined(with: .scale(scale: 0.98)))
            }
            .navigationSplitViewStyle(.balanced)
            .tint(.appPrimary)
        }
        .preferredColorScheme(.dark)
        .environmentObject(motionManager)
        .onAppear {
            motionManager.setEnabled(motionEnabled)
        }
        .onChange(of: motionEnabled) { _, isEnabled in
            motionManager.setEnabled(isEnabled)
        }
        .animation(
            .spring(response: 0.4, dampingFraction: 0.7, blendDuration: 0),
            value: selectedTab
        )
    }
}

private struct SidebarView: View {
    @Binding var selectedTab: AppTab?
    @Binding var motionEnabled: Bool
    @Binding var notificationsEnabled: Bool
    @Binding var feedbackRemindersEnabled: Bool

    @EnvironmentObject private var authViewModel: AuthViewModel

    @State private var showProfileSettings = true
    @State private var showPreferences = true
    @State private var showAccount = true

    private let navigationTabs: [AppTab] = [
        .dashboard,
        .diagnose,
        .recommendations,
        .products
    ]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Crop Copilot")
                        .font(.system(size: 24, weight: .bold, design: .rounded))
                        .foregroundStyle(.white)
                    Text("Antigravity Lab")
                        .font(.caption)
                        .foregroundStyle(Color.appPrimary)
                        .textCase(.uppercase)
                        .tracking(1.2)
                }

                VStack(spacing: 10) {
                    ForEach(navigationTabs) { tab in
                        Button {
                            selectedTab = tab
                        } label: {
                            HStack(spacing: 10) {
                                Image(systemName: tab.icon)
                                    .frame(width: 18, height: 18)
                                Text(tab.title)
                                    .font(.subheadline.weight(.semibold))
                                Spacer()
                            }
                            .foregroundStyle(
                                selectedTab == tab ? Color.black : Color.white.opacity(0.92)
                            )
                            .padding(.horizontal, 12)
                            .padding(.vertical, 10)
                            .background(
                                Capsule()
                                    .fill(
                                        selectedTab == tab
                                            ? Color.appPrimary
                                            : Color.white.opacity(0.06)
                                    )
                            )
                            .overlay(
                                Capsule()
                                    .strokeBorder(.white.opacity(0.14), lineWidth: 0.6)
                            )
                        }
                        .buttonStyle(AntigravityScaleButtonStyle())
                    }
                }

                Divider().background(.white.opacity(0.15))

                DisclosureGroup("Profile & Farm", isExpanded: $showProfileSettings) {
                    VStack(alignment: .leading, spacing: 10) {
                        Button {
                            selectedTab = .profile
                        } label: {
                            Label("Edit Profile", systemImage: "person.crop.circle")
                                .font(.subheadline)
                                .foregroundStyle(.white.opacity(0.92))
                        }
                        .buttonStyle(.plain)
                    }
                    .padding(.top, 6)
                }
                .foregroundStyle(.white)

                DisclosureGroup("Preferences", isExpanded: $showPreferences) {
                    VStack(alignment: .leading, spacing: 10) {
                        Toggle("Enable motion parallax", isOn: $motionEnabled)
                        Toggle("Enable reminders", isOn: $feedbackRemindersEnabled)
                        Toggle("Enable notifications", isOn: $notificationsEnabled)
                    }
                    .toggleStyle(.switch)
                    .tint(.appPrimary)
                    .font(.caption)
                    .foregroundStyle(.white.opacity(0.9))
                    .padding(.top, 6)
                }
                .foregroundStyle(.white)

                DisclosureGroup("Account", isExpanded: $showAccount) {
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Text("Version")
                                .font(.caption)
                                .foregroundStyle(.white.opacity(0.72))
                            Spacer()
                            Text(
                                Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String
                                    ?? "1.0"
                            )
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(.white.opacity(0.92))
                        }

                        Button(role: .destructive) {
                            Task {
                                await authViewModel.signOut()
                            }
                        } label: {
                            Label("Sign Out", systemImage: "rectangle.portrait.and.arrow.right")
                                .font(.subheadline.weight(.semibold))
                                .foregroundStyle(.red)
                        }
                        .buttonStyle(.plain)
                    }
                    .padding(.top, 6)
                }
                .foregroundStyle(.white)
            }
            .padding(14)
        }
        .antigravityGlass(cornerRadius: 24)
        .antigravityFloat(amplitude: 6, parallaxScale: 4)
    }
}

private struct ProductsPlaceholderView: View {
    var body: some View {
        NavigationStack {
            VStack(spacing: 16) {
                Image(systemName: "shippingbox.fill")
                    .font(.system(size: 52))
                    .foregroundStyle(Color.appPrimary)
                Text("Products")
                    .font(.title3.bold())
                    .foregroundStyle(.white)
                Text("Product catalog for iOS is being aligned with the new AWS runtime.")
                    .font(.subheadline)
                    .foregroundStyle(.white.opacity(0.7))
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 28)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(Color.clear)
            .navigationTitle("Products")
        }
    }
}

private struct VideoPlayerView: UIViewRepresentable {
    let filename: String
    let ext: String

    func makeUIView(context: Context) -> UIView {
        PlayerUIView(frame: .zero, filename: filename, ext: ext)
    }

    func updateUIView(_ uiView: UIView, context: Context) {}
}

private final class PlayerUIView: UIView {
    private let playerLayer = AVPlayerLayer()
    private var playerLoopLooper: AVPlayerLooper?

    init(frame: CGRect, filename: String, ext: String) {
        super.init(frame: frame)

        if let url = Bundle.main.url(forResource: filename, withExtension: ext) {
            let playerItem = AVPlayerItem(url: url)
            let queuePlayer = AVQueuePlayer(playerItem: playerItem)
            playerLayer.player = queuePlayer
            playerLayer.videoGravity = .resizeAspectFill
            playerLoopLooper = AVPlayerLooper(player: queuePlayer, templateItem: playerItem)
            layer.addSublayer(playerLayer)
            queuePlayer.play()
            queuePlayer.isMuted = true
        }
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        playerLayer.frame = bounds
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
}
