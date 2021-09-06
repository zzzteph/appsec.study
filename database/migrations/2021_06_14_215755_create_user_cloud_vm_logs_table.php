<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateUserCloudVmLogsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('user_cloud_vm_logs', function (Blueprint $table) {
            $table->id();
			$table->foreignId('user_cloud_vm_id')->constrained();
			$table->enum('type', ['action', 'log', 'error'])->default('log');
			$table->text('message')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('user_cloud_vm_logs');
    }
}
