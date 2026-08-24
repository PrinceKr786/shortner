# Fix _all-skins.min.css 404 on GitHub Pages
# Replace link tag with inline CSS for both skin-blue (user) and skin-black (admin)

$skinBlue = @'
    <!-- Inline skin-blue CSS (GitHub Pages fix) -->
    <style>
        .skin-blue .main-header .navbar{background-color:#3c8dbc}
        .skin-blue .main-header .navbar .nav>li>a{color:#fff}
        .skin-blue .main-header .navbar .nav>li>a:hover,.skin-blue .main-header .navbar .nav>li>a:active,.skin-blue .main-header .navbar .nav>li>a:focus,.skin-blue .main-header .navbar .nav .open>a,.skin-blue .main-header .navbar .nav .open>a:hover,.skin-blue .main-header .navbar .nav .open>a:focus,.skin-blue .main-header .navbar .nav>.active>a{background:rgba(0,0,0,0.1);color:#f6f6f6}
        .skin-blue .main-header .navbar .nav>.active>a{border-bottom-color:#3c8dbc}
        .skin-blue .main-header .logo{background-color:#367fa9;color:#fff}
        .skin-blue .main-header .logo:hover{background-color:#357ca5}
        .skin-blue .main-sidebar{background-color:#222d32}
        .skin-blue .main-sidebar .sidebar>.sidebar-menu>li.active>a{border-left-color:#3c8dbc;background:#1a252f}
        .skin-blue .main-sidebar .sidebar>.sidebar-menu>li>a:hover{background:#1a252f}
        .skin-blue .main-sidebar .sidebar>.sidebar-menu>li>.treeview-menu>li.active>a,.skin-blue .main-sidebar .sidebar>.sidebar-menu>li>.treeview-menu>li>a:hover{background:#1a252f;color:#fff}
        .skin-blue .main-sidebar .sidebar>.sidebar-menu>.treeview.active>a,.skin-blue .main-sidebar .sidebar>.sidebar-menu>.treeview>li>a:hover{color:#fff}
        .skin-blue .main-sidebar .sidebar .sidebar-menu>li>a{color:#b8c7ce}
        .skin-blue .main-sidebar .sidebar .sidebar-menu>li>.treeview-menu>li>a{color:#8091a0}
        .skin-blue .main-sidebar .sidebar .user-panel>.info,.skin-blue .main-sidebar .sidebar .user-panel>.info>a{color:#fff}
        .skin-blue .wrapper,.skin-blue .main-footer{background-color:#ecf0f5}
        .skin-blue .sidebar .shorten-button{background:#3c8dbc;border-color:#367fa9;color:#fff}
        .skin-blue .sidebar .shorten-button:hover{background:#367fa9;border-color:#2e6da4}
        .btn-social{position:relative;padding-left:44px;text-align:left;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .btn-social>:first-child{position:absolute;left:0;top:0;bottom:0;width:42px;line-height:24px;font-size:1.6em;text-align:center;border-right:1px solid rgba(255,255,255,.15)}
        .btn-github{color:#fff;background-color:#444;border-color:rgba(0,0,0,.2)}
        .btn-github:hover,.btn-github:focus{color:#fff;background-color:#333;border-color:rgba(0,0,0,.2)}
    </style>
'@

$skinBlack = @'
    <!-- Inline skin-black CSS (GitHub Pages fix) -->
    <style>
        .skin-black .main-header .navbar{background-color:#fff;border-bottom:1px solid #eee}
        .skin-black .main-header .navbar .nav>li>a{color:#333}
        .skin-black .main-header .navbar .nav>li>a:hover,.skin-black .main-header .navbar .nav>li>a:active,.skin-black .main-header .navbar .nav>li>a:focus,.skin-black .main-header .navbar .nav .open>a,.skin-black .main-header .navbar .nav .open>a:hover,.skin-black .main-header .navbar .nav .open>a:focus,.skin-black .main-header .navbar .nav>.active>a{background:#f9f9f9;color:#333}
        .skin-black .main-header .navbar .nav>.active>a{border-bottom-color:#fff}
        .skin-black .main-header .logo{background-color:#367fa9;color:#fff}
        .skin-black .main-header .logo:hover{background-color:#357ca5}
        .skin-black .main-sidebar{background-color:#222d32}
        .skin-black .main-sidebar .sidebar>.sidebar-menu>li.active>a{border-left-color:#3c8dbc;background:#1a252f}
        .skin-black .main-sidebar .sidebar>.sidebar-menu>li>a:hover{background:#1a252f}
        .skin-black .main-sidebar .sidebar>.sidebar-menu>li>.treeview-menu>li.active>a,.skin-black .main-sidebar .sidebar>.sidebar-menu>li>.treeview-menu>li>a:hover{background:#1a252f;color:#fff}
        .skin-black .main-sidebar .sidebar>.sidebar-menu>.treeview.active>a,.skin-black .main-sidebar .sidebar>.sidebar-menu>.treeview>li>a:hover{color:#fff}
        .skin-black .main-sidebar .sidebar .sidebar-menu>li>a{color:#b8c7ce}
        .skin-black .main-sidebar .sidebar .sidebar-menu>li>.treeview-menu>li>a{color:#8091a0}
        .skin-black .main-sidebar .sidebar .user-panel>.info,.skin-black .main-sidebar .sidebar .user-panel>.info>a{color:#fff}
        .skin-black .wrapper,.skin-black .main-footer{background-color:#ecf0f5}
        .skin-black .sidebar .shorten-button{background:#3c8dbc;border-color:#367fa9;color:#fff}
        .skin-black .sidebar .shorten-button:hover{background:#367fa9;border-color:#2e6da4}
    </style>
'@

# Process user pages
Get-ChildItem "$PSScriptRoot\user\*.html" | ForEach-Object {
    $content = [IO.File]::ReadAllText($_.FullName)
    if ($content.Contains("_all-skins.min.css")) {
        $content = $content.Replace('    <link rel="stylesheet" href="../vendor/dashboard/css/skins/_all-skins.min.css">', $skinBlue)
        [IO.File]::WriteAllText($_.FullName, $content)
        Write-Output ("USER: " + $_.Name)
    }
}

# Process admin pages
Get-ChildItem "$PSScriptRoot\admin\*.html" | ForEach-Object {
    $content = [IO.File]::ReadAllText($_.FullName)
    if ($content.Contains("_all-skins.min.css")) {
        $content = $content.Replace('    <link rel="stylesheet" href="../vendor/dashboard/css/skins/_all-skins.min.css">', $skinBlack)
        [IO.File]::WriteAllText($_.FullName, $content)
        Write-Output ("ADMIN: " + $_.Name)
    }
}

Write-Output "DONE!"
