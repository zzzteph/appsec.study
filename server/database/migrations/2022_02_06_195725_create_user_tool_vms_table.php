<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateUserToolVmsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('user_tool_vms', function (Blueprint $table) {
            $table->id();
			$table->string('ip')->default('');
			$table->string('instance_id')->default('');
			$table->foreignId('tool_vm_id')->constrained()->onUpdate('cascade')->onDelete('cascade');
			$table->foreignId('user_id')->constrained()->onUpdate('cascade')->onDelete('cascade');
			$table->integer('progress')->default(0);
			$table->enum('status', ['todo','starting','running','tostop','stopping','terminated']);
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
        Schema::dropIfExists('user_tool_vms');
    }
}
