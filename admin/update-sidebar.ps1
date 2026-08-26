$adminDir = "C:\zzz\URL Shortnur\vs code\shortner\admin"
$files = Get-ChildItem -Path $adminDir -Filter "*.html" | Where-Object { $_.Name -ne "index.html" }

foreach ($file in $files) {
    $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
    $original = $content

    # 1. REMOVE "Go Page Ads" link (handle both with and without class attribute)
    $content = $content -replace '(?m)\s*<li class=""><a href="go-settings\.html"><i class="fa fa-circle-o"></i> Go Page Ads</a></li>\r?\n', "`n"

    # 2. ADD "Delete" to Plans treeview
    $plansPattern = '(<li class=""><a href="plans\.html"><i class="fa fa-circle-o"></i> List</a></li>)'
    $plansReplace = '$1' + "`n" + '                        <li class=""><a href="admin-delete-plan.html"><i class="fa fa-circle-o"></i> Delete</a></li>'
    $content = [regex]::Replace($content, $plansPattern, $plansReplace)

    # 3. ADD "Delete" to Users treeview
    $usersPattern = '(<li class=""><a href="users-export\.html"><i class="fa fa-circle-o"></i> Export</a></li>)'
    $usersReplace = '$1' + "`n" + '                        <li class=""><a href="admin-delete-user.html"><i class="fa fa-circle-o"></i> Delete</a></li>'
    $content = [regex]::Replace($content, $usersPattern, $usersReplace)

    # 4. ADD "Edit" and "Export" to Withdraws treeview
    $withdrawPattern = '(<li class=""><a href="withdrawals\.html"><i class="fa fa-circle-o"></i> List</a></li>)'
    $withdrawReplace = '$1' + "`n" + '                        <li class=""><a href="admin-edit-withdraw.html"><i class="fa fa-circle-o"></i> Edit</a></li>' + "`n" + '                        <li class=""><a href="admin-export-withdraws.html"><i class="fa fa-circle-o"></i> Export</a></li>'
    $content = [regex]::Replace($content, $withdrawPattern, $withdrawReplace)

    # 5. ADD "Upgrade" to Advanced treeview
    $advancedPattern = '(<li class=""><a href="system-info\.html"><i class="fa fa-circle-o"></i> System Info</a></li>)'
    $advancedReplace = '$1' + "`n" + '                        <li class=""><a href="admin-upgrade.html"><i class="fa fa-circle-o"></i> Upgrade</a></li>'
    $content = [regex]::Replace($content, $advancedPattern, $advancedReplace)

    if ($content -ne $original) {
        [System.IO.File]::WriteAllText($file.FullName, $content, [System.Text.Encoding]::UTF8)
        Write-Host "Updated: $($file.Name)"
    } else {
        Write-Host "No changes: $($file.Name)"
    }
}
